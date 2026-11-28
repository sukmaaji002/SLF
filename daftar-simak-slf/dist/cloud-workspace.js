"use strict";

let slfCloud;
let slfAccount;
let slfDraftStore;
let slfCloudRows = [];
let slfCloudTimer;
let slfPendingSync;
let slfCloudQueue = Promise.resolve();
let slfReleaseAccount;
let slfAuthUser;
let slfAuthMode = "login";
let slfChecklistItem = "";

const slfCloudOwner = () => slfAccount?.id ?? "";
globalThis.slfCloudOwner = slfCloudOwner;
const slfWorkspaceKey = (owner) => owner ? "drafts:" + owner : "drafts";
const slfCloudStatus = (message = "") => { $("cloud-status").textContent = message; };

function slfQueueCloud(action) {
  const next = slfCloudQueue.then(action);
  slfCloudQueue = next.catch((error) => { slfCloudStatus(slfCloudError(error)); });
  return next;
}

function slfCloudError(error) {
  if (error?.code === "email_address_not_authorized") return "Email ini belum bisa menerima pesan dari layanan akun.";
  if (error?.code === "weak_password") return "Pilih kata sandi yang lebih kuat.";
  if (error?.code === "42501") return "Setelan akses draf online perlu diperiksa.";
  if (error?.code === "invalid_credentials") return "Email atau kata sandi salah.";
  if (error?.code === "email_not_confirmed") return "Konfirmasi alamat email sebelum masuk.";
  if (error?.code === "over_email_send_rate_limit" || error?.status === 429) return "Terlalu banyak percobaan. Coba lagi nanti.";
  if (error?.code === "PGRST205" || error?.code === "42P01") return "Basis data draf online belum disiapkan.";
  if (error?.name === "StorageApiError" || error?.status === 413) return "Foto gagal disinkronkan. Periksa ukuran foto dan kapasitas penyimpanan.";
  if (error instanceof Error && /^(Foto online|Ada foto Daftar Simak|Format draf|Rujukan foto)/.test(error.message)) return error.message;
  return "Layanan online belum dapat dihubungi.";
}

function slfLocalWorkspace() {
  const project = draft("Kajian baru", preset);
  return { projects: [project], current: project.id };
}

function slfProjectOptions() {
  const entries = new Map(slfCloudRows.map(({ id, name }) => [id, name]));
  for (const { id, name } of workspace.projects) entries.set(id, name);
  return [...entries].map(([id, name]) => new Option(name, id));
}

function slfUpdateAccountControls() {
  const signedIn = Boolean(slfAuthUser);
  const account = $("cloud-account");
  const email = slfAuthUser?.email ?? "";
  $("cloud-status").hidden = !signedIn;
  $("cloud-copy").hidden = !slfAccount || !workspace?.cloud?.[workspace.current]?.conflict;
  account.hidden = !signedIn;
  if (!signedIn) account.open = false;
  $("cloud-avatar").textContent = email.charAt(0).toLocaleUpperCase("id") || "A";
  $("cloud-email").textContent = email;
}

function slfRequestCloudSync({ pull = true } = {}) {
  if (!slfAuthUser) return;
  if (slfPendingSync) {
    slfPendingSync.pull ||= pull;
    return;
  }
  const request = { pull };
  slfPendingSync = request;
  slfQueueCloud(() => {
    slfPendingSync = undefined;
    if (slfAccount) return slfSyncCloud(request);
    if (slfAuthUser && navigator.onLine) return slfChangeAccount(slfAuthUser);
  }).catch(() => {});
}

function slfRememberEdit(projectId) {
  if (!slfAccount) return;
  workspace.cloud[projectId] = { ...workspace.cloud[projectId], dirty: crypto.randomUUID() };
  clearTimeout(slfCloudTimer);
  slfCloudTimer = setTimeout(() => {
    slfRequestCloudSync({ pull: false });
  }, 1200);
}

function slfEditorBusy() {
  if (editor.querySelector('input[type="file"]:disabled')) return true;
  try {
    return editor.querySelector(".checklist-frame")?.contentWindow?.slfChecklistWriting?.() ?? false;
  } catch {
    return false;
  }
}

async function slfInstallRemote(snapshot, id, state, store) {
  const { project, checklist } = validateBackup({ version: 1, project: snapshot.project, checklist: snapshot.checklist });
  project.id = id;
  upgradeReportDraft(project);
  const previous = state.cloud[id];
  if (store !== slfDraftStore || previous?.dirty || (state.current === id && slfEditorBusy())) return false;
  const surface = document.querySelector(".workspace");
  const wasInert = surface.inert;
  if (state.current === id) surface.inert = true;
  try {
    await storeChecklistPhotos(id, snapshot.blobs, slfCloudOwner());
    if (store !== slfDraftStore || state.cloud[id] !== previous) return false;
    localStorage.setItem(slfChecklistKey(id, slfCloudOwner()), JSON.stringify(checklist));
  } finally {
    surface.inert = wasInert;
  }
  const index = state.projects.findIndex((entry) => entry.id === id);
  if (index < 0) state.projects.push(project);
  else state.projects[index] = project;
  state.cloud[id] = { revision: snapshot.revision, media: snapshot.media, mediaByDigest: snapshot.mediaByDigest, updatedAt: snapshot.updatedAt };
  return true;
}

async function slfSyncCloud({ pull = true } = {}) {
  if (!slfAccount) return;
  if (!navigator.onLine) {
    slfCloudStatus("Offline. Sinkronisasi dilanjutkan otomatis saat terhubung.");
    return;
  }
  const store = slfDraftStore;
  const state = workspace;
  let failed;
  let remoteChanged = false;
  for (const [id, pending] of Object.entries(state.cloud)) {
    if (!pending.dirty || pending.conflict) continue;
    const local = state.projects.find((item) => item.id === id);
    if (!local) continue;
    try {
      const upload = await store.push(structuredClone(local), readChecklist(id), pending);
      const latest = state.cloud[id];
      state.cloud[id] = { ...upload, updatedAt: new Date().toISOString(),
        ...(latest.dirty !== pending.dirty ? { dirty: latest.dirty } : {}) };
    } catch (error) {
      if (error instanceof SlfSyncConflict) state.cloud[id] = { ...state.cloud[id], conflict: true };
      else failed = error;
    }
  }
  await save(false);
  if (pull && !failed) {
    slfCloudRows = await store.list();
    const id = state.current;
    const entry = slfCloudRows.find((row) => row.id === id);
    if (entry && !state.cloud[id]?.dirty && entry.revision !== state.cloud[id]?.revision && !slfEditorBusy()) {
      remoteChanged = await slfInstallRemote(await store.pull(id), id, state, store);
      if (remoteChanged) await save(false);
    }
  }
  if (remoteChanged) {
    const project = current();
    if (typeof active === "number" && !project.chapters[active]) active = "cover";
    render();
  } else {
    $("projects").replaceChildren(...slfProjectOptions());
    $("projects").value = state.current;
  }
  slfUpdateAccountControls();
  slfRenderDashboard();
  if (Object.values(state.cloud).some((entry) => entry.conflict)) {
    slfCloudStatus("Draf berubah di perangkat lain. Simpan perubahan sebagai salinan saat membuka draf yang konflik.");
  } else if (failed) {
    slfCloudStatus(slfCloudError(failed));
  } else {
    slfCloudStatus();
  }
}

async function slfOpenDraft(id) {
  if (!slfAccount || !slfCloudRows.some((row) => row.id === id)) return false;
  const state = workspace;
  const store = slfDraftStore;
  const surface = document.querySelector(".workspace");
  surface.inert = true;
  $("projects").disabled = true;
  try {
    if (!(await slfInstallRemote(await store.pull(id), id, state, store))) return false;
    setCurrent(id);
    return true;
  } finally {
    surface.inert = false;
    $("projects").disabled = false;
    $("projects").value = state.current;
  }
}

async function slfTakeAccountLock(id) {
  if (!navigator.locks) return true;
  return new Promise((resolve, reject) => {
    navigator.locks.request("slf-edit:" + id, { ifAvailable: true }, (lock) => {
      if (!lock) return resolve(false);
      return new Promise((release) => {
        slfReleaseAccount = release;
        resolve(true);
      });
    }).catch(reject);
  });
}

async function slfChangeAccount(user) {
  if ((user?.id ?? "") === slfCloudOwner() && user?.id === slfAuthUser?.id) return;
  const previousUser = slfAuthUser;
  slfAuthUser = user;
  clearTimeout(slfCloudTimer);
  const main = document.querySelector("main");
  const publicPage = $("slf-public");
  const workspacePage = $("slf-workspace");
  const leaveWorkspace = previousUser?.id !== user?.id && !workspacePage.hidden;
  main.inert = true;
  if (leaveWorkspace) {
    for (const id of ["project-dialog", "chapter-dialog", "preview-dialog", "dashboard-type-dialog", "dashboard-copy-dialog"]) {
      const dialog = $(id);
      if (dialog.open) dialog.close();
    }
    workspacePage.hidden = true;
    publicPage.hidden = false;
    slfDashboardView(false);
    window.scrollTo(0, 0);
    if (!user) {
      const url = new URL(location.href);
      for (const key of ["proyek", "bagian", "butir"]) url.searchParams.delete(key);
      history.replaceState(null, "", url);
      $("landing-login").focus({ preventScroll: true });
    }
  }
  try {
    if (slfAccount) {
      await save(false);
      slfReleaseAccount?.();
      slfReleaseAccount = undefined;
    }
    slfCloudStatus();
    slfCloudRows = [];
    slfDraftStore = undefined;
    slfAccount = undefined;
    const lock = !user || await slfTakeAccountLock(user.id);
    if (user && lock) {
      slfAccount = user;
      slfDraftStore = slfCreateDraftStore(slfCloud, user.id, checklistPhoto);
    }
    const stored = slfAccount ? await storeValue(database, "workspace", slfWorkspaceKey(slfAccount.id)) : undefined;
    workspace = stored ?? slfLocalWorkspace();
    const starter = stored ? undefined : workspace.current;
    if (slfAccount) workspace.cloud ??= {};
    for (const project of workspace.projects) upgradeReportDraft(project);
    const query = new URLSearchParams(location.search);
    const requested = query.get("proyek");
    let openRequested = false;
    active = "cover";
    if (slfAccount) {
      try {
        slfCloudRows = await slfDraftStore.list();
        const id = slfCloudRows.some((item) => item.id === requested) ? requested : undefined;
        if (id && (!workspace.cloud[id]?.dirty)) {
          const row = slfCloudRows.find((item) => item.id === id);
          if (row?.revision !== workspace.cloud[id]?.revision) await slfInstallRemote(await slfDraftStore.pull(id), id, workspace, slfDraftStore);
        }
      } catch (error) {
        slfCloudStatus(slfCloudError(error));
      }
      openRequested = Boolean(requested && workspace.projects.some((project) => project.id === requested));
      if (openRequested) {
        workspace.current = requested;
        if (starter && starter !== requested) workspace.projects = workspace.projects.filter((project) => project.id !== starter);
      }
      if (openRequested && (query.get("bagian") === "simak" || current().workflowVersion === 2)) {
        active = "checklist";
        slfChecklistItem = allChecklistItems.some(({ id }) => id === query.get("butir")) ? query.get("butir") : "";
      }
    } else {
      slfCloudStatus(user ? "Akun terbuka di tab lain. Sinkronisasi dilanjutkan otomatis setelah tab itu ditutup." : "");
    }
    if (dialog.open) dialog.close();
    render();
    if (slfAccount) await save(false);
    slfUpdateAccountControls();
    $("landing-auth-status").textContent = "";
    if (user) {
      const moveFocus = publicPage.contains(document.activeElement);
      publicPage.hidden = true;
      workspacePage.hidden = false;
      if (previousUser?.id !== user.id) {
        dashboardPeriod = "monthly";
        dashboardYear = undefined;
      }
      $("dashboard-action-status").hidden = true;
      slfDashboardView(Boolean(slfAccount && !openRequested));
      window.scrollTo(0, 0);
      main.inert = !slfAccount;
      if (moveFocus) {
        const target = slfAccount ? $(openRequested ? "page-title" : "dashboard-title") :
          $("cloud-account").querySelector("summary");
        target.focus({ preventScroll: true });
      }
    }
    if (slfAccount) await slfSyncCloud();
  } catch (error) {
    if (user && workspacePage.hidden) {
      $("landing-auth-status").textContent = "Ruang kerja belum bisa dibuka. Muat ulang halaman untuk mencoba lagi.";
    }
    throw error;
  } finally {
    main.inert = Boolean(slfAuthUser && !slfAccount);
  }
}

async function slfDuplicateDraft(id, name, owner) {
  if (!owner || owner !== slfCloudOwner()) throw Error("Akun tidak tersedia.");
  const state = workspace;
  const cached = state.projects.find((project) => project.id === id);
  const row = slfCloudRows.find((entry) => entry.id === id);
  const status = state.cloud[id];
  const useRemote = !cached || (row && !status?.dirty && row.revision !== status?.revision);
  const remote = useRemote ? await slfDraftStore.pull(id) : undefined;
  const snapshot = remote ? validateBackup({ version: 1, project: remote.project, checklist: remote.checklist }) :
    { project: structuredClone(cached), checklist: readChecklist(id, owner) };
  const project = snapshot.project;
  project.id = crypto.randomUUID();
  project.name = name;
  project.createdAt = new Date().toISOString();
  upgradeReportDraft(project);
  const photos = {};
  for (const key of checklistPhotos(snapshot.checklist)) {
    const photo = remote ? remote.blobs[key] : await checklistPhoto(id, key, undefined, owner);
    if (!photo) throw Error("Ada foto Daftar Simak yang belum tersimpan di perangkat ini.");
    photos[key] = photo;
  }
  if (state !== workspace || owner !== slfCloudOwner()) throw Error("Akun tidak tersedia.");
  await storeChecklistPhotos(project.id, photos, owner);
  localStorage.setItem(slfChecklistKey(project.id, owner), JSON.stringify(snapshot.checklist));
  state.projects.push(project);
  setCurrent(project.id, true);
}

async function slfCopyConflict() {
  const original = current();
  if (!slfAccount || !workspace.cloud[original.id]?.conflict) return;
  const project = structuredClone(original);
  project.id = crypto.randomUUID();
  project.name = original.name.slice(0, 96) + " (salinan perangkat ini)";
  project.createdAt = new Date().toISOString();
  const checklist = readChecklist(original.id);
  for (const key of checklistPhotos(checklist)) {
    const photo = await checklistPhoto(original.id, key);
    if (!photo) throw Error("Ada foto Daftar Simak yang belum tersimpan di perangkat ini.");
    await checklistPhoto(project.id, key, photo);
  }
  localStorage.setItem(slfChecklistKey(project.id, slfCloudOwner()), JSON.stringify(checklist));
  workspace.projects.push(project);
  workspace.cloud[project.id] = { dirty: crypto.randomUUID() };
  await save(false);
  await slfSyncCloud({ pull: false });
  if (workspace.cloud[project.id].dirty) {
    setCurrent(project.id);
    return;
  }
  const old = workspace.cloud[original.id];
  workspace.cloud[original.id] = { revision: old.revision, media: old.media };
  setCurrent(project.id);
  await slfSyncCloud();
}

function slfShowPassword(show) {
  $("cloud-password").type = show ? "text" : "password";
  $("cloud-password-toggle").textContent = show ? "Sembunyikan" : "Lihat sandi";
}

function slfShowAuth(mode) {
  slfAuthMode = mode;
  const auth = $("cloud-dialog");
  const form = $("cloud-auth");
  const update = mode === "update";
  const recover = mode === "recover";
  const email = auth.open && !update ? form.email.value : "";
  form.reset();
  form.email.value = email;
  slfShowPassword(false);
  const [title, description, submit] = {
    login: ["Masuk", "Buka kembali proyek yang tersimpan di akun Anda.", "Masuk"],
    signup: ["Buat akun", "Kami akan mengirim tautan konfirmasi ke email Anda.", "Daftar"],
    recover: ["Atur ulang kata sandi", "Masukkan email yang terdaftar untuk menerima tautan pemulihan.", "Kirim tautan"],
    update: ["Kata sandi baru", "Gunakan minimal 8 karakter untuk kata sandi baru.", "Simpan kata sandi"],
  }[mode];
  $("cloud-dialog-title").textContent = title;
  $("cloud-dialog-description").textContent = description;
  $("cloud-submit").textContent = submit;
  const feedback = $("cloud-auth-message");
  feedback.textContent = "";
  feedback.removeAttribute("data-error");
  $("cloud-mode-actions").hidden = update;
  for (const control of $("cloud-mode-actions").querySelectorAll("button")) {
    control.hidden = control.dataset.authMode === mode || (mode !== "login" && control.dataset.authMode !== "login");
  }
  form.email.closest("label").hidden = update;
  form.email.required = !update;
  $("cloud-password-field").hidden = recover;
  form.password.required = !recover;
  form.password.autocomplete = mode === "login" ? "current-password" : "new-password";
  form.password.minLength = mode === "login" ? 0 : 8;
  if (!auth.open) auth.showModal();
  (update ? form.password : form.email).focus({ preventScroll: true });
}

function initSlfCloud() {
  slfCloud = slfCloudClient();
  if (!slfCloud) {
    $("landing-auth-status").textContent = "Layanan masuk belum tersedia. Muat ulang halaman untuk mencoba lagi.";
    return;
  }
  $("cloud-controls").hidden = false;
  const form = $("cloud-auth");
  const auth = $("cloud-dialog");
  const redirect = new URL("./", location.href).href;
  for (const button of document.querySelectorAll("[data-landing-auth]")) {
    button.addEventListener("click", () => slfShowAuth(button.dataset.landingAuth));
    button.disabled = false;
  }
  $("cloud-cancel").addEventListener("click", () => auth.close());
  $("cloud-password-toggle").addEventListener("click", () => slfShowPassword(form.password.type === "password"));
  auth.addEventListener("close", () => { form.password.value = ""; slfShowPassword(false); });
  const account = $("cloud-account");
  document.addEventListener("click", (event) => {
    if (account.open && !account.contains(event.target)) account.open = false;
  });
  account.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && account.open) {
      account.open = false;
      account.querySelector("summary").focus();
    }
  });
  const authLinks = $("cloud-mode-actions").querySelectorAll("button");
  for (const control of authLinks) {
    control.addEventListener("click", () => slfShowAuth(control.dataset.authMode));
  }
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const control = $("cloud-submit");
    const message = $("cloud-auth-message");
    const mode = slfAuthMode;
    const email = form.email.value.trim();
    const password = form.password.value;
    control.disabled = true;
    for (const link of authLinks) link.disabled = true;
    message.removeAttribute("data-error");
    message.textContent = "Memproses…";
    try {
      if (mode === "recover") {
        slfCheckCloudResult(await slfCloud.auth.resetPasswordForEmail(email, { redirectTo: redirect }));
        message.textContent = "Jika alamat terdaftar, tautan pemulihan akan dikirim.";
      } else if (mode === "signup") {
        const result = slfCheckCloudResult(await slfCloud.auth.signUp({ email, password, options: { emailRedirectTo: redirect } }));
        if (result.session) auth.close();
        else message.textContent = "Periksa email untuk mengonfirmasi pendaftaran.";
      } else if (mode === "update") {
        slfCheckCloudResult(await slfCloud.auth.updateUser({ password }));
        auth.close();
        slfCloudStatus("Kata sandi diperbarui.");
      } else {
        slfCheckCloudResult(await slfCloud.auth.signInWithPassword({ email, password }));
        auth.close();
      }
    } catch (error) {
      message.textContent = slfCloudError(error);
      message.setAttribute("data-error", "");
    } finally {
      form.password.value = "";
      slfShowPassword(false);
      control.disabled = false;
      for (const link of authLinks) link.disabled = false;
    }
  });
  $("cloud-logout").addEventListener("click", () => {
    account.open = false;
    slfQueueCloud(async () => {
      if (slfAccount) await slfSyncCloud({ pull: false });
      slfCheckCloudResult(await slfCloud.auth.signOut({ scope: "local" }));
      await slfChangeAccount(undefined);
    }).catch(() => {});
  });
  $("cloud-copy").addEventListener("click", () => { slfQueueCloud(slfCopyConflict).catch(() => {}); });
  slfCloud.auth.onAuthStateChange((event, session) => {
    if (!["INITIAL_SESSION", "SIGNED_IN", "SIGNED_OUT", "PASSWORD_RECOVERY"].includes(event)) return;
    setTimeout(() => {
      slfQueueCloud(() => slfChangeAccount(session?.user)).catch(() => {});
      if (event === "PASSWORD_RECOVERY") slfShowAuth("update");
    }, 0);
  });
  const refresh = () => {
    if (!document.hidden) slfRequestCloudSync();
    else if (slfAccount && Object.values(workspace.cloud).some((entry) => entry.dirty && !entry.conflict)) {
      slfRequestCloudSync({ pull: false });
    }
  };
  window.addEventListener("online", () => slfRequestCloudSync());
  window.addEventListener("offline", () => {
    if (slfAccount) slfCloudStatus("Offline. Sinkronisasi dilanjutkan otomatis saat terhubung.");
  });
  window.addEventListener("focus", refresh);
  document.addEventListener("visibilitychange", refresh);
  setInterval(refresh, 20000);
}
