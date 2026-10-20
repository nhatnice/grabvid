import express from 'express';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import youtubeDl from 'youtube-dl-exec';
import ffmpegPath from 'ffmpeg-static';
import { createHmac, randomBytes } from 'node:crypto';

const app = express();
const YT_DLP: string = (youtubeDl as any).constants.YOUTUBE_DL_PATH;
const FFMPEG = ffmpegPath as string;
const PORT = process.env.PORT || 80;

// Only links we generated (signed) may be fetched, so /file and /merge are not open proxies.
const SECRET = randomBytes(32);
const sign = (u: string) => createHmac('sha256', SECRET).update(u).digest('hex');

app.set('view engine', 'ejs');
app.set('views', path.join(import.meta.dir, 'views'));
app.use(express.static(path.join(import.meta.dir, 'public')));

app.get('/', (req, res) => res.render('index'));
app.get(['/help/about', '/help/website'], (req, res) => res.render('help'));

// Ask yt-dlp for metadata of any supported site.
async function getInfo(url: string): Promise<any> {
    const proc = Bun.spawn([YT_DLP, '-J', '--no-playlist', '--no-warnings', '--', url], {
        stdout: 'pipe',
        stderr: 'pipe',
    });
    const [out, err, code] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
        proc.exited,
    ]);
    if (code !== 0) throw new Error(err.trim().split('\n').pop() || 'yt-dlp failed');
    return JSON.parse(out);
}

const filename = (title: string, ext: string) => `${(title || 'video').replace(/[^\p{L}\p{N} _.-]+/gu, '').trim().slice(0, 100) || 'video'}.${ext}`;

const hasVideo = (f: any) => f.vcodec && f.vcodec !== 'none';
const hasAudio = (f: any) => f.acodec && f.acodec !== 'none';
const fileLink = (page: string, formatId: string, n: string) =>
    `/file?${new URLSearchParams({ u: page, f: formatId, s: sign(`${page}#${formatId}`), n })}`;
const mergeLink = (page: string, h: number, n: string) =>
    `/merge?${new URLSearchParams({ u: page, h: String(h), s: sign(`${page}#${h}`), n })}`;

// One mp4 row per resolution (always with sound) + best m4a audio.
function buildRows(info: any, page: string) {
    const all = (info.formats || []).filter((f: any) => f.format_id && !/m3u8/.test(f.protocol || '') && f.ext !== 'mhtml');
    const rows: { quality: string; ext: string; type: string; url: string }[] = [];
    const heights = [...new Set<number>(all.filter((f: any) => f.ext === 'mp4' && hasVideo(f) && f.height).map((f: any) => f.height))].sort((a, b) => b - a);
    for (const h of heights) {
        const muxed = all.find((f: any) => f.ext === 'mp4' && f.height === h && hasVideo(f) && hasAudio(f));
        rows.push({
            quality: `${h}p`,
            ext: 'mp4',
            type: 'Video',
            url: muxed ? fileLink(page, muxed.format_id, filename(info.title, 'mp4')) : mergeLink(page, h, filename(info.title, 'mp4')),
        });
    }
    const audio = all
        .filter((f: any) => f.ext === 'm4a' && hasAudio(f) && !hasVideo(f))
        .sort((a: any, b: any) => (b.abr || 0) - (a.abr || 0))[0];
    if (audio) {
        rows.push({ quality: `${Math.round(audio.abr || 0)}kbps`, ext: 'm4a', type: 'Audio', url: fileLink(page, audio.format_id, filename(info.title, 'm4a')) });
    }
    return rows;
}

app.get('/download', async (req, res) => {
    let url: URL;
    try {
        url = new URL(String(req.query.url || '').trim());
        if (!/^https?:$/.test(url.protocol)) throw new Error();
    } catch {
        return res.render('error', { error: 'ERROR! Invalid URL or video is private!' });
    }

    try {
        const info = await getInfo(url.href);
        const formats = buildRows(info, url.href);
        res.render('download', {
            title: info.title || '',
            thumbnail: info.thumbnail || '',
            formats,
        });
    } catch (e) {
        console.error(e);
        res.render('error', { error: 'ERROR! Invalid URL or video is private!' });
    }
});

// Single format: yt-dlp downloads it with its chunked downloader (much faster than a plain GET
// on googlevideo, which throttles single connections) and writes the bytes to stdout.
app.get('/file', async (req, res) => {
    const u = String(req.query.u || '');
    const f = String(req.query.f || '');
    if (!u || !f || sign(`${u}#${f}`) !== req.query.s) return res.status(403).send('Forbidden');
    const name = String(req.query.n || 'video');

    const proc = Bun.spawn([YT_DLP, '-q', '--no-playlist', '--no-warnings', '-f', f, '-o', '-', '--', u], {
        stdout: 'pipe',
        stderr: 'ignore',
    });
    res.on('close', () => proc.kill());
    const reader = proc.stdout.getReader();
    try {
        const first = await reader.read();
        if (first.done) return res.status(502).send('Download failed');
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(name)}`);
        res.setHeader('Content-Type', 'application/octet-stream');
        res.write(first.value);
        for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            if (!res.write(value)) await new Promise((r) => res.once('drain', r));
        }
        res.end();
    } catch (e) {
        console.error(e);
        if (!res.headersSent) res.status(502).send('Download failed');
        else res.end();
    }
});

// Merged format: yt-dlp downloads video + audio and muxes them with ffmpeg into a temp file,
// which is sent to the browser and then deleted.
app.get('/merge', async (req, res) => {
    const u = String(req.query.u || '');
    const h = parseInt(String(req.query.h || ''), 10);
    if (!u || !h || sign(`${u}#${h}`) !== req.query.s) return res.status(403).send('Forbidden');
    const name = String(req.query.n || 'video.mp4');

    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'grabvid-'));
    const cleanup = () => fs.rm(dir, { recursive: true, force: true }).catch(() => {});
    try {
        const proc = Bun.spawn(
            [
                YT_DLP, '-q', '--no-playlist', '--no-warnings', '--ffmpeg-location', FFMPEG,
                '-f', `bv*[height=${h}][ext=mp4]+ba[ext=m4a]/b[height<=${h}][ext=mp4]`,
                '--merge-output-format', 'mp4', '-o', path.join(dir, 'video.%(ext)s'), '--', u,
            ],
            { stdout: 'ignore', stderr: 'ignore' },
        );
        if ((await proc.exited) !== 0) {
            await cleanup();
            return res.status(502).send('Download failed');
        }
        res.download(path.join(dir, 'video.mp4'), name, cleanup);
    } catch (e) {
        console.error(e);
        await cleanup();
        if (!res.headersSent) res.status(502).send('Download failed');
    }
});

app.listen(PORT, () => console.log(`Listening on :${PORT}`));
