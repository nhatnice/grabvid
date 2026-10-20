FROM oven/bun:1-debian

# deno: yt-dlp needs a JS runtime to solve YouTube's n/sig challenges. Without one,
# googlevideo throttles downloads and some formats go missing.
COPY --from=denoland/deno:bin /deno /usr/local/bin/deno

# python3 runs the yt-dlp binary; ca-certificates lets yt-dlp/ffmpeg reach HTTPS sources.
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY . .

ENV NODE_ENV=production \
    PORT=80
EXPOSE 80

CMD ["bun", "index.ts"]
