"use strict";

const slfChecklistKey = (id, owner = "") => "daftar-simak-slf:v2" +
  (owner ? ":akun:" + owner : "") + (id ? ":" + id : "");

const slfPhotoKey = (id, key, owner = "") => (owner ? "akun:" + owner + ":" : "") + (id ? id + ":" : "") + key;
const slfCloudPhotoTypes = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif",
  "image/avif": "avif", "image/bmp": "bmp", "image/tiff": "tif",
};
const slfCloudPhotoRef = /^[a-f0-9]{64}\.(jpg|png|webp|gif|avif|bmp|tif)$/;

async function slfPhotoDigest(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

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
      for (const facility of [...(block.fireInspections ?? []), ...(block.lightningInspections ?? [])]) {
        for (const entry of facility.locations) yield* entry.photos ?? [];
      }
      for (const entry of block.structureComponents ?? []) yield* entry.photos ?? [];
      for (const entry of block.structureTest?.items ?? []) yield* entry.photos ?? [];
    }
  }
}

function slfCreateDraftStore(client, owner, photos) {
  const drafts = () => client.from("slf_drafts");
  const bucket = client.storage.from("slf-photos");
  const verifiedUploads = new Set();

  async function upload(projectId, blob, previous, known, mediaByDigest) {
    const extension = slfCloudPhotoTypes[blob.type];
    if (!extension || !blob.size || blob.size > 50_000_000) {
      throw Error("Foto online harus berupa JPEG, PNG, WebP, GIF, AVIF, BMP, atau TIFF, maksimal 50 MB per foto.");
    }
    const digest = await slfPhotoDigest(await blob.arrayBuffer()) + "." + extension;
    if (mediaByDigest[digest]) return mediaByDigest[digest];
    const previousRef = previous.mediaByDigest?.[digest] ?? digest;
    if (slfCloudPhotoRef.test(previousRef) && known.has(previousRef)) {
      mediaByDigest[digest] = previousRef;
      return previousRef;
    }
    const file = await slfPhotoDigest(new TextEncoder().encode(previous.dirty + ":" + digest)) + "." + extension;
    const path = owner + "/" + projectId + "/" + file;
    if (!verifiedUploads.has(path)) {
      const { error } = await bucket.upload(path, blob, { contentType: blob.type, upsert: false });
      if (error) {
        const duplicate = ["Duplicate", "ResourceAlreadyExists", "KeyAlreadyExists", "already_exists"].includes(error.code) ||
          /asset already exists|resource already exists|duplicate/i.test(error.message ?? "");
        if (!duplicate) throw error;
      }
      verifiedUploads.add(path);
    }
    mediaByDigest[digest] = file;
    return file;
  }

  async function download(projectId, ref) {
    if (!slfCloudPhotoRef.test(ref ?? "")) throw Error("Rujukan foto tidak valid.");
    return slfCheckCloudResult(await bucket.download(owner + "/" + projectId + "/" + ref));
  }

  async function pack(project, checklist, previous) {
    const copy = structuredClone(project);
    const files = {};
    const known = new Set(previous.media ?? []);
    const mediaByDigest = {};
    const refs = new Set();
    for (const entry of slfReportPhotos(copy)) {
      if (!entry.image) continue;
      if (!imageSource.test(entry.image)) throw Error("Format draf memuat foto yang tidak valid.");
      const ref = await upload(project.id, await (await fetch(entry.image)).blob(), previous, known, mediaByDigest);
      refs.add(ref);
      entry.image = { file: ref };
    }
    for (const key of checklistPhotos(checklist)) {
      const blob = await photos(project.id, key);
      if (!blob) throw Error("Ada foto Daftar Simak yang belum tersimpan di perangkat ini.");
      const ref = await upload(project.id, blob, previous, known, mediaByDigest);
      refs.add(ref);
      files[key] = ref;
    }
    return { version: 1, project: copy, checklist, files, media: [...refs], mediaByDigest };
  }

  async function removeRetiredPhotos() {
    if (typeof client.rpc !== "function") return;
    try {
      const paths = slfCheckCloudResult(await client.rpc("slf_retired_photo_paths"));
      if (paths?.length) slfCheckCloudResult(await bucket.remove(paths));
    } catch {
      // Leave the objects queued for the next sync.
    }
  }

  return {
    async list() {
      const rows = [];
      const pageSize = 500;
      for (let start = 0; ; start += pageSize) {
        const page = slfCheckCloudResult(await drafts().select("id,name,revision,updated_at,created_at:payload->project->>createdAt")
          .eq("owner_id", owner).order("updated_at", { ascending: false }).order("id").range(start, start + pageSize - 1));
        rows.push(...page);
        if (page.length < pageSize) {
          await removeRetiredPhotos();
          return rows;
        }
      }
    },
    async pull(id) {
      const row = slfCheckCloudResult(await drafts().select("id,name,revision,payload,updated_at")
        .eq("owner_id", owner).eq("id", id).single());
      const { project, checklist, files, media, mediaByDigest, version } = row.payload;
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
        }
      }
      const blobs = {};
      for (const key of checklistPhotos(checklist)) blobs[key] = await getFile(files?.[key]);
      return { project, checklist, blobs, revision: row.revision, media, mediaByDigest, updatedAt: row.updated_at };
    },
    async push(project, checklist, previous) {
      const payload = await pack(project, checklist, previous);
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
      if (previous.media?.some((file) => !payload.media.includes(file))) await removeRetiredPhotos();
      return { revision, media: payload.media, mediaByDigest: payload.mediaByDigest };
    },
  };
}
