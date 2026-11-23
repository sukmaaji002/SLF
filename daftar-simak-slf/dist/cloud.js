"use strict";

const slfChecklistKey = (id, owner = "") => "daftar-simak-slf:v2" +
  (owner ? ":akun:" + owner : "") + (id ? ":" + id : "");

const slfPhotoKey = (id, key, owner = "") => (owner ? "akun:" + owner + ":" : "") + (id ? id + ":" : "") + key;
const slfCloudPhotoTypes = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif",
  "image/avif": "avif", "image/bmp": "bmp", "image/tiff": "tif",
};

class SlfSyncConflict extends Error {}

function slfCloudClient() {
  const { url, key } = slfCloudConfig;
  if (!/^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(url) || !/^sb_publishable_[a-zA-Z0-9_-]+$/.test(key)) return null;
  return globalThis.supabase?.createClient(url, key, {
    auth: { flowType: "pkce", storageKey: "slf-supabase-account" },
  }) ?? null;
}

function slfCheckCloudResult({ data, error }) {
  if (error) throw error;
  return data;
}

function* slfReportPhotos(project) {
  yield project.cover;
  for (const chapter of project.chapters) {
    yield* chapter.photos ?? [];
    for (const block of chapter.blocks) {
      if (block.type === "photo") yield block;
      yield* block.photos ?? [];
    }
  }
}

function slfCreateDraftStore(client, owner, photos) {
  const drafts = () => client.from("slf_drafts");
  const bucket = client.storage.from("slf-photos");
  const verifiedUploads = new Set();
  const photoDigests = new Map();

  async function upload(projectId, blob, known) {
    const extension = slfCloudPhotoTypes[blob.type];
    if (!extension || !blob.size || blob.size > 50_000_000) {
      throw Error("Foto online harus berupa JPEG, PNG, WebP, GIF, AVIF, BMP, atau TIFF, maksimal 50 MB per foto.");
    }
    const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
    const file = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("") + "." + extension;
    const path = owner + "/" + projectId + "/" + file;
    if (!known.has(file) && !verifiedUploads.has(path)) {
      const { error } = await bucket.upload(path, blob, { contentType: blob.type, upsert: false });
      if (error) {
        const duplicate = ["Duplicate", "ResourceAlreadyExists", "KeyAlreadyExists", "already_exists"].includes(error.code) ||
          /asset already exists|resource already exists|duplicate/i.test(error.message ?? "");
        if (!duplicate) throw error;
      }
      verifiedUploads.add(path);
    }
    return file;
  }

  async function download(projectId, ref) {
    if (!/^[a-f0-9]{64}\.(jpg|png|webp|gif|avif|bmp|tif)$/.test(ref ?? "")) throw Error("Rujukan foto tidak valid.");
    return slfCheckCloudResult(await bucket.download(owner + "/" + projectId + "/" + ref));
  }

  async function pack(project, checklist, previousMedia) {
    const copy = structuredClone(project);
    const files = {};
    const known = new Set(previousMedia ?? []);
    const refs = new Set();
    const keepDigests = new Set();
    for (const entry of slfReportPhotos(copy)) {
      if (!entry.image) continue;
      if (!imageSource.test(entry.image)) throw Error("Format draf memuat foto yang tidak valid.");
      const key = project.id + ":" + entry.image;
      let ref = photoDigests.get(key);
      if (!ref) {
        ref = await upload(project.id, await (await fetch(entry.image)).blob(), known);
        photoDigests.set(key, ref);
      }
      keepDigests.add(key);
      refs.add(ref);
      entry.image = { file: ref };
    }
    for (const key of photoDigests.keys()) {
      if (key.startsWith(project.id + ":") && !keepDigests.has(key)) photoDigests.delete(key);
    }
    for (const key of checklistPhotos(checklist)) {
      const blob = await photos(project.id, key);
      if (!blob) throw Error("Ada foto Daftar Simak yang belum tersimpan di perangkat ini.");
      const ref = await upload(project.id, blob, known);
      refs.add(ref);
      files[key] = ref;
    }
    return { version: 1, project: copy, checklist, files, media: [...refs] };
  }

  return {
    async list() {
      return slfCheckCloudResult(await drafts().select("id,name,revision,updated_at")
        .eq("owner_id", owner).order("updated_at", { ascending: false }));
    },
    async pull(id) {
      const row = slfCheckCloudResult(await drafts().select("id,name,revision,payload,updated_at")
        .eq("owner_id", owner).eq("id", id).single());
      const { project, checklist, files, media, version } = row.payload;
      if (version !== 1 || project?.id !== id || !reportTemplates[project.template] ||
          !Array.isArray(project.chapters) || !checklist?.identity || !checklist?.checks) throw Error("Format draf online tidak dikenali.");
      const memo = new Map();
      const getFile = (ref) => {
        if (!memo.has(ref)) memo.set(ref, download(id, ref));
        return memo.get(ref);
      };
      for (const entry of slfReportPhotos(project)) {
        if (entry.image?.file) {
          const ref = entry.image.file;
          entry.image = await blobData(await getFile(ref));
          photoDigests.set(id + ":" + entry.image, ref);
        }
      }
      const blobs = {};
      for (const key of checklistPhotos(checklist)) blobs[key] = await getFile(files?.[key]);
      return { project, checklist, blobs, revision: row.revision, media };
    },
    async push(project, checklist, previous) {
      const payload = await pack(project, checklist, previous?.media);
      const revision = previous.dirty;
      const data = { name: project.name.trim().slice(0, 120) || "Kajian tanpa judul", revision, payload };
      let alreadyWritten = false;
      if (!previous.revision) {
        const { error } = await drafts().insert({ id: project.id, ...data });
        if (error?.code === "23505") alreadyWritten = true;
        else if (error) throw error;
      } else {
        const result = slfCheckCloudResult(await drafts().update(data)
          .eq("owner_id", owner).eq("id", project.id).eq("revision", previous.revision).select("revision"));
        alreadyWritten = !result.length;
      }
      if (alreadyWritten) {
        const existing = slfCheckCloudResult(await drafts().select("revision")
          .eq("owner_id", owner).eq("id", project.id).maybeSingle());
        if (existing?.revision !== revision) throw new SlfSyncConflict();
      }
      return { revision, media: payload.media };
    },
  };
}

