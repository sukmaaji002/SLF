"use strict";

let slfCloud;
let slfAccount;
let slfDraftStore;
let slfCloudRows = [];
let slfCloudTimer;
let slfCloudQueue = Promise.resolve();
let slfReleaseAccount;
let slfAuthUser;
let slfAuthMode = "login";
let slfChecklistItem = "";

const slfCloudOwner = () => slfAccount?.id ?? "";
globalThis.slfCloudOwner = slfCloudOwner;
const slfWorkspaceKey = (owner) => owner ? "drafts:" + owner : "drafts";
const slfCloudStatus = (message) => { $("cloud-status").textContent = message; };

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
  return "Layanan online tidak dapat dihubungi. Coba Sinkronkan lagi.";
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
  $("cloud-login").hidden = Boolean(slfAuthUser);
  $("cloud-logout").hidden = !slfAuthUser;
  $("cloud-sync").hidden = !slfAuthUser;
  $("cloud-copy").hidden = !slfAccount || !workspace?.cloud?.[workspace.current]?.conflict;
  $("cloud-email").textContent = slfAuthUser?.email ?? "";
}

function slfRememberEdit(projectId) {
  if (!slfAccount) return;
  workspace.cloud[projectId] = { ...workspace.cloud[projectId], dirty: crypto.randomUUID() };
  slfCloudStatus("Perubahan menunggu sinkronisasi.");
  clearTimeout(slfCloudTimer);
  slfCloudTimer = setTimeout(() => {
    slfQueueCloud(() => slfSyncCloud({ pull: false })).catch(() => {});
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
  state.cloud[id] = { revision: snapshot.revision, media: snapshot.media };
  return true;
}

async function slfSyncCloud({ pull = true } = {}) {
  if (!slfAccount) return;
  const store = slfDraftStore;
  const state = workspace;
  let failed;
  let remoteChanged = false;
  slfCloudStatus("Menyinkronkan…");
  for (const [id, pending] of Object.entries(state.cloud)) {
    if (!pending.dirty || pending.conflict) continue;
    const local = state.projects.find((item) => item.id === id);
    if (!local) continue;
    try {
      const upload = await store.push(structuredClone(local), readChecklist(id), pending);
      const latest = state.cloud[id];
      state.cloud[id] = { ...upload, ...(latest.dirty !== pending.dirty ? { dirty: latest.dirty } : {}) };
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
  if (Object.values(state.cloud).some((entry) => entry.conflict)) {
    slfCloudStatus("Draf berubah di perangkat lain. Simpan perubahan sebagai salinan saat membuka draf yang konflik.");
  } else if (failed) {
    slfCloudStatus(slfCloudError(failed));
  } else if (Object.values(state.cloud).some((entry) => entry.dirty)) {
    slfCloudStatus("Perubahan menunggu sinkronisasi.");
  } else {
    slfCloudStatus(state.cloud[state.current]?.revision ? "Draf tersinkron." : "Draf baru akan disinkronkan setelah diisi.");
  }
}

async function slfOpenDraft(id) {
  if (!slfAccount || !slfCloudRows.some((row) => row.id === id)) return;
  const state = workspace;
  const store = slfDraftStore;
  const surface = document.querySelector(".workspace");
  surface.inert = true;
  $("projects").disabled = true;
  try {
    if (await slfInstallRemote(await store.pull(id), id, state, store)) setCurrent(id);
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
  slfAuthUser = user;
  clearTimeout(slfCloudTimer);
  const main = document.querySelector("main");
  main.inert = true;
  try {
    if (slfAccount) {
      await save(false);
      slfReleaseAccount?.();
      slfReleaseAccount = undefined;
    }
    slfCloudRows = [];
    slfDraftStore = undefined;
    slfAccount = undefined;
    const lock = !user || await slfTakeAccountLock(user.id);
    if (user && lock) {
      slfAccount = user;
      slfDraftStore = slfCreateDraftStore(slfCloud, user.id, checklistPhoto);
    }
    const stored = await storeValue(database, "workspace", slfWorkspaceKey(slfCloudOwner()));
    workspace = stored ?? slfLocalWorkspace();
    const starter = stored ? undefined : workspace.current;
    if (slfAccount) workspace.cloud ??= {};
    for (const project of workspace.projects) upgradeReportDraft(project);
    const query = new URLSearchParams(location.search);
    const requested = query.get("proyek");
    active = "cover";
    if (slfAccount) {
      try {
        slfCloudRows = await slfDraftStore.list();
        const cached = workspace.projects.find((project) => project.id === workspace.current);
        const id = slfCloudRows.some((item) => item.id === requested) ? requested :
          slfCloudRows.some((item) => item.id === cached?.id) || workspace.cloud[cached?.id]?.dirty ? cached.id : slfCloudRows[0]?.id;
        if (id && (!workspace.cloud[id]?.dirty)) {
          const row = slfCloudRows.find((item) => item.id === id);
          if (row?.revision !== workspace.cloud[id]?.revision) await slfInstallRemote(await slfDraftStore.pull(id), id, workspace, slfDraftStore);
        }
        if (workspace.projects.some((project) => project.id === id)) {
          workspace.current = id;
          if (starter && starter !== id) workspace.projects = workspace.projects.filter((project) => project.id !== starter);
        }
      } catch (error) {
        slfCloudStatus(slfCloudError(error));
      }
      if (query.get("bagian") === "simak" && workspace.current === requested) {
        active = "checklist";
        slfChecklistItem = checklistItems.some(({ id }) => id === query.get("butir")) ? query.get("butir") : "";
      }
    } else {
      slfCloudStatus(user ? "Akun sedang diedit di tab lain. Tutup tab itu lalu klik Sinkronkan." : "Mode lokal");
    }
    if (dialog.open) dialog.close();
    render();
    await save(false);
    slfUpdateAccountControls();
    if (slfAccount) await slfSyncCloud();
  } finally {
    main.inert = false;
  }
}

async function slfCopyConflict() {
  const original = current();
  if (!slfAccount || !workspace.cloud[original.id]?.conflict) return;
  const project = structuredClone(original);
  project.id = crypto.randomUUID();
  project.name = original.name.slice(0, 96) + " (salinan perangkat ini)";
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

function slfShowAuth(mode) {
  slfAuthMode = mode;
  const auth = $("cloud-dialog");
  const form = $("cloud-auth");
  const update = mode === "update";
  const recover = mode === "recover";
  form.reset();
  const labels = { login: "Masuk", signup: "Daftar akun", recover: "Kirim tautan pemulihan", update: "Simpan kata sandi baru" };
  $("cloud-dialog-title").textContent = labels[mode];
  $("cloud-submit").textContent = labels[mode];
  $("cloud-auth-message").textContent = "";
  $("cloud-mode-actions").hidden = update;
  form.email.closest("label").hidden = update;
  form.email.required = !update;
  form.password.closest("label").hidden = recover;
  form.password.required = !recover;
  form.password.autocomplete = mode === "login" ? "current-password" : "new-password";
  form.password.minLength = mode === "login" ? 0 : 8;
  if (!auth.open) auth.showModal();
}

function initSlfCloud() {
  slfCloud = slfCloudClient();
  if (!slfCloud) return;
  $("cloud-controls").hidden = false;
  const form = $("cloud-auth");
  const auth = $("cloud-dialog");
  const redirect = new URL("./", location.href).href;
  $("cloud-login").addEventListener("click", () => slfShowAuth("login"));
  $("cloud-cancel").addEventListener("click", () => auth.close());
  for (const control of $("cloud-mode-actions").querySelectorAll("button")) {
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
    } finally {
      form.password.value = "";
      control.disabled = false;
    }
  });
  $("cloud-logout").addEventListener("click", () => {
    slfQueueCloud(async () => {
      if (slfAccount) await slfSyncCloud({ pull: false });
      slfCheckCloudResult(await slfCloud.auth.signOut({ scope: "local" }));
      await slfChangeAccount(undefined);
    }).catch(() => {});
  });
  $("cloud-sync").addEventListener("click", () => {
    slfQueueCloud(() => slfAccount ? slfSyncCloud() : slfChangeAccount(slfAuthUser)).catch(() => {});
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
    if (slfAccount && !document.hidden) slfQueueCloud(() => slfSyncCloud()).catch(() => {});
  };
  window.addEventListener("online", refresh);
  window.addEventListener("focus", refresh);
  setInterval(refresh, 20000);
}


