import * as tus from "tus-js-client";
import API from "./axios";

// Sends a file straight from this browser to Bunny Stream; the API only signs it.
// The same file for the same video continues where it stopped, even after a refresh.
export function uploadToBunny(file, signed, title, onProgress) {
  let upload;
  let settled = false;
  let confirmTimer;
  let cancel = () => {};

  const promise = new Promise((resolve, reject) => {
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      clearInterval(confirmTimer);
      fn(value);
    };
    // Bunny's final upload reply can be slow or unreadable even though it already has every byte.
    // Once all bytes are sent, ask the API whether Bunny has the video, and move on as soon as it does;
    // the status polling then reports processing / ready / failed.
    const confirmWithBunny = () => {
      if (confirmTimer) return;
      confirmTimer = setInterval(async () => {
        try {
          const { data } = await API.get(`/admin/videos/bunny/${signed.videoId}/status`);
          if (data.success && data.rawStatus >= 1) finish(resolve);
        } catch {
          // Keep waiting; tus may still report success or an error itself.
        }
      }, 3000);
    };

    upload = new tus.Upload(file, {
      endpoint: signed.endpoint,
      retryDelays: [0, 3000, 5000, 10000, 20000, 60000],
      headers: {
        AuthorizationSignature: signed.signature,
        AuthorizationExpire: String(signed.expire),
        VideoId: signed.videoId,
        LibraryId: String(signed.libraryId),
      },
      metadata: { filetype: file.type, title },
      fingerprint: async () => `bunny-${signed.videoId}-${file.name}-${file.size}`,
      removeFingerprintOnSuccess: true,
      onProgress: (sent, total) => {
        onProgress?.(Math.round((sent / total) * 100));
        if (sent === total) confirmWithBunny();
      },
      onSuccess: () => finish(resolve),
      onError: (err) => finish(reject, err),
    });

    cancel = () => {
      upload.abort();
      finish(reject, Object.assign(new Error("Upload cancelled"), { cancelled: true }));
    };

    upload.findPreviousUploads()
      .then((previous) => {
        if (settled) return;
        if (previous.length) upload.resumeFromPreviousUpload(previous[0]);
        upload.start();
      })
      .catch(() => {
        if (!settled) upload.start();
      });
  });

  return { promise, cancel: () => cancel() };
}
