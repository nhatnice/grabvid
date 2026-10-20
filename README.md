# GrabVid

![GrabVid home page](images/Screenshot%202026-10-20%20at%2018.49.50.png)

GrabVid is a small web app for downloading videos from popular sites. Paste a link, pick a quality, and the file downloads straight to your device.

## Features

- Supports the sites yt-dlp supports, including YouTube, Facebook, Instagram, TikTok, Twitter/X, Reddit, Vimeo, Twitch, Tumblr, and VK.
- Lists every MP4 resolution the source offers, plus the best M4A audio track.
- Videos with separate video and audio streams (common on YouTube above 360p) are merged with ffmpeg, so every MP4 row includes sound.
- The clicked row shows a loading state while the server prepares the file, then the browser saves it.

![GrabVid results page](images/Screenshot%202026-10-20%20at%2018.50.13.png)

## Tech stack

- [Bun](https://bun.sh) runtime, running TypeScript directly
- [Express](https://expressjs.com) and [EJS](https://ejs.co) for server-side rendering
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) for extracting media information and downloading files
- [ffmpeg](https://ffmpeg.org) (via `ffmpeg-static`) for merging video and audio
- [Sass](https://sass-lang.com) for the stylesheets

## Requirements

- [Bun](https://bun.sh/docs/installation) 1.x
- Python 3.10 or newer (yt-dlp is shipped as a Python zipapp)
- [Deno](https://deno.com) (recommended): yt-dlp uses it to solve YouTube's JavaScript challenges. Without it, YouTube downloads are slow and some formats are missing.

## Setup

```bash
git clone https://github.com/nhatnice/grabvid.git
cd grabvid
bun install
```

`bun install` downloads the yt-dlp and ffmpeg binaries. The packages `youtube-dl-exec` and `ffmpeg-static` are listed in `trustedDependencies` in `package.json`, so Bun runs their install scripts.

## Running locally

```bash
bun start
```

`bun start` compiles the Sass files and starts the server. Then open http://localhost:80.

Port 80 needs elevated privileges on macOS and Linux. To use another port:

```bash
PORT=3000 bun start
```

and open http://localhost:3000.

For development without rebuilding the CSS, run `bun index.ts` directly.

## Running with Docker

```bash
docker build -t grabvid .
docker run --rm -p 80:80 grabvid
```

The image is based on `oven/bun:1-debian`. It installs Python 3 for yt-dlp and copies Deno in for YouTube challenge solving. The app listens on port 80 inside the container.

## Deployment

The workflow in `.github/workflows/deploy.yml` builds the Docker image, pushes it to GitHub Container Registry, and calls a Dokploy deploy webhook on every push to `main`. It needs one repository secret:

- `DOKPLOY_DEPLOY_HOOK_URL`: the deploy webhook URL from your Dokploy application

## Project structure

```
index.ts          Express server: /download, /file, /merge
views/            EJS templates (index, download, help, error)
public/           Static assets: CSS, JS, images, fonts
images/           README screenshots
Dockerfile        Container build
```

## How it works

1. `/download?url=...` runs `yt-dlp -J` on the link and renders one row per available format.
2. Single-file formats are streamed through `/file`, which runs `yt-dlp -o -` and pipes the bytes to the browser.
3. Merged formats go through `/merge`, which lets yt-dlp download both streams and mux them with ffmpeg into a temporary file. The file is sent to the browser and then deleted.
4. Download links are signed with an HMAC key generated at startup, so `/file` and `/merge` only serve links the server created.

## Disclaimer

Downloading content may violate the terms of service of the source site or the copyright of the uploader. Only download content you have the right to save, and use this software at your own risk.

## Contact

contact@nhattran.dev
