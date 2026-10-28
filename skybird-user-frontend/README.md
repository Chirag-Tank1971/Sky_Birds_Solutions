# SkyBirds User Frontend

## Secure course playback

The Watch page no longer fetches a whole MP4 into a Blob. It requests a short-lived playback token from the API and plays protected HLS.

Install dependencies with:

```bash
npm install
npm run dev
```

Set `VITE_API_URL` in `.env`/`.env.local` to the backend API URL, for example `http://localhost:5000/api`.

HLS.js is used on browsers without native HLS; Safari/iOS uses native HLS where available.

The player includes a visible user-specific watermark, protected fullscreen container, `controlsList="nodownload"`, disabled PiP/remote playback where supported, and casual context-menu/shortcut deterrents. These are not DRM and cannot guarantee prevention of copying.
