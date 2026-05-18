#!/usr/bin/env node
import { createReadStream, existsSync, readFileSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, extname, join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "..");
const ENTRY = "005-knowledge-video-template.html";
const STORY_PATH = join(__dirname, "story.json");

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8"
};

function parseArgs(argv) {
  const options = {
    fps: 60,
    size: "1920x1080",
    start: 0,
    end: null,
    output: "exports/005-knowledge-video-template-1080p60.mp4",
    framesDir: null,
    keepFrames: false,
    crf: 18,
    preset: "medium",
    chrome: process.env.CHROME_PATH || null
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "--keep-frames") {
      options.keepFrames = true;
      continue;
    }

    if (!arg.startsWith("--")) {
      throw new Error(`Unknown argument: ${arg}`);
    }

    if (typeof next === "undefined" || next.startsWith("--")) {
      throw new Error(`Missing value for ${arg}`);
    }

    index += 1;
    switch (arg) {
      case "--fps":
        options.fps = Number(next);
        break;
      case "--size":
        options.size = next;
        break;
      case "--start":
        options.start = Number(next);
        break;
      case "--end":
        options.end = Number(next);
        break;
      case "--output":
        options.output = next;
        break;
      case "--frames-dir":
        options.framesDir = next;
        break;
      case "--crf":
        options.crf = Number(next);
        break;
      case "--preset":
        options.preset = next;
        break;
      case "--chrome":
        options.chrome = next;
        break;
      default:
        throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
}

function printHelp() {
  console.log(`Usage:
  node 005-knowledge-video-template-assets/export-video.mjs [options]

Options:
  --fps <number>          Output frame rate. Default: 60
  --size <WxH>            Browser viewport and video size. Default: 1920x1080
  --start <seconds>       Start time in seconds. Default: 0
  --end <seconds>         End time in seconds. Default: story meta duration
  --output <path>         MP4 output path. Default: exports/005-knowledge-video-template-1080p60.mp4
  --frames-dir <path>     Temporary PNG frame directory.
  --keep-frames           Keep captured PNG frames after ffmpeg finishes.
  --crf <number>          libx264 CRF quality. Lower is better. Default: 18
  --preset <name>         ffmpeg x264 preset. Default: medium
  --chrome <path>         Chrome executable. Default: CHROME_PATH or common system paths

Example:
  node 005-knowledge-video-template-assets/export-video.mjs --fps 60 --size 1920x1080 --output exports/005-knowledge-video-template-1080p60.mp4
`);
}

function parseSize(value) {
  const match = /^(\d+)x(\d+)$/i.exec(value);
  if (!match) {
    throw new Error(`Invalid --size value "${value}". Expected WxH, for example 1920x1080.`);
  }

  return {
    width: Number(match[1]),
    height: Number(match[2])
  };
}

function readStoryDuration() {
  const story = JSON.parse(readFileSync(STORY_PATH, "utf8"));
  return Number(story.meta?.duration) || 180;
}

function resolveFromRoot(path) {
  return resolve(REPO_ROOT, path);
}

function findChrome(explicitPath) {
  const candidates = [
    explicitPath,
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser"
  ].filter(Boolean);

  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) {
    throw new Error("Chrome executable not found. Install Google Chrome/Chromium or pass --chrome <path>.");
  }

  return found;
}

function startStaticServer(rootDir) {
  const server = createServer((request, response) => {
    try {
      const url = new URL(request.url || "/", "http://127.0.0.1");
      const pathname = url.pathname === "/" ? `/${ENTRY}` : decodeURIComponent(url.pathname);
      const filePath = resolve(rootDir, `.${pathname}`);

      if (!filePath.startsWith(rootDir)) {
        response.writeHead(403);
        response.end("Forbidden");
        return;
      }

      if (!existsSync(filePath)) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }

      response.writeHead(200, {
        "Content-Type": MIME_TYPES[extname(filePath)] || "application/octet-stream",
        "Cache-Control": "no-store"
      });
      createReadStream(filePath).pipe(response);
    } catch (error) {
      response.writeHead(500);
      response.end(error.message);
    }
  });

  return new Promise((resolveServer, rejectServer) => {
    server.once("error", rejectServer);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolveServer({
        server,
        origin: `http://127.0.0.1:${address.port}`
      });
    });
  });
}

function waitForDevToolsUrl(process) {
  return new Promise((resolveUrl, rejectUrl) => {
    const timer = setTimeout(() => {
      rejectUrl(new Error("Timed out waiting for Chrome DevTools endpoint."));
    }, 15000);

    const handleData = (data) => {
      const text = String(data);
      const match = text.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) {
        clearTimeout(timer);
        process.stderr.off("data", handleData);
        process.stdout.off("data", handleData);
        resolveUrl(match[1]);
      }
    };

    process.stderr.on("data", handleData);
    process.stdout.on("data", handleData);
    process.once("exit", (code) => {
      clearTimeout(timer);
      rejectUrl(new Error(`Chrome exited before DevTools was ready. Exit code: ${code}`));
    });
  });
}

async function launchChrome(chromePath, width, height) {
  const userDataDir = join(tmpdir(), `005-video-export-${process.pid}-${Date.now()}`);
  await mkdir(userDataDir, { recursive: true });

  const chrome = spawn(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--hide-scrollbars",
    "--mute-audio",
    "--no-first-run",
    "--no-default-browser-check",
    "--no-sandbox",
    `--remote-debugging-port=0`,
    `--user-data-dir=${userDataDir}`,
    `--window-size=${width},${height}`,
    "about:blank"
  ], {
    stdio: ["ignore", "pipe", "pipe"]
  });

  const wsUrl = await waitForDevToolsUrl(chrome);
  return {
    chrome,
    wsUrl,
    userDataDir
  };
}

class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.nextId = 1;
    this.pending = new Map();
  }

  connect() {
    return new Promise((resolveConnect, rejectConnect) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.addEventListener("open", resolveConnect, { once: true });
      this.ws.addEventListener("error", rejectConnect, { once: true });
      this.ws.addEventListener("message", (event) => {
        const message = JSON.parse(event.data);
        if (!message.id || !this.pending.has(message.id)) {
          return;
        }

        const pending = this.pending.get(message.id);
        this.pending.delete(message.id);

        if (message.error) {
          pending.reject(new Error(message.error.message));
        } else {
          pending.resolve(message.result || {});
        }
      });
    });
  }

  send(method, params = {}, sessionId = null) {
    const id = this.nextId;
    this.nextId += 1;
    const message = { id, method, params };
    if (sessionId) {
      message.sessionId = sessionId;
    }

    this.ws.send(JSON.stringify(message));
    return new Promise((resolveSend, rejectSend) => {
      this.pending.set(id, {
        resolve: resolveSend,
        reject: rejectSend
      });
    });
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

function waitForProcessExit(process, timeout = 3000) {
  if (process.exitCode !== null || process.signalCode !== null) {
    return Promise.resolve();
  }

  return new Promise((resolveExit) => {
    const timer = setTimeout(() => {
      process.kill("SIGKILL");
      resolveExit();
    }, timeout);

    process.once("exit", () => {
      clearTimeout(timer);
      resolveExit();
    });
  });
}

async function stopChrome(chromeHandle) {
  if (!chromeHandle) {
    return;
  }

  chromeHandle.chrome.kill("SIGTERM");
  await waitForProcessExit(chromeHandle.chrome);
  await rm(chromeHandle.userDataDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 120 });
}

async function evaluate(client, sessionId, expression, awaitPromise = false) {
  return client.send("Runtime.evaluate", {
    expression,
    awaitPromise,
    returnByValue: true
  }, sessionId);
}

async function createPage(client, url, width, height) {
  const { targetId } = await client.send("Target.createTarget", {
    url: "about:blank"
  });
  const { sessionId } = await client.send("Target.attachToTarget", {
    targetId,
    flatten: true
  });

  await client.send("Page.enable", {}, sessionId);
  await client.send("Runtime.enable", {}, sessionId);
  await client.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
    screenWidth: width,
    screenHeight: height
  }, sessionId);
  await client.send("Page.navigate", { url }, sessionId);

  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    const ready = await evaluate(
      client,
      sessionId,
      "Boolean(window.KnowledgeVideoTemplate && document.readyState === 'complete')"
    );
    if (ready.result?.value) {
      return { targetId, sessionId };
    }
    await sleep(100);
  }

  const body = await evaluate(client, sessionId, "document.body ? document.body.innerText : ''");
  throw new Error(`Page did not finish booting. Body text: ${body.result?.value || ""}`);
}

async function captureFrames(client, sessionId, options) {
  const {
    width,
    height,
    fps,
    start,
    totalFrames,
    framesDir
  } = options;

  await mkdir(framesDir, { recursive: true });

  for (let frame = 0; frame < totalFrames; frame += 1) {
    const time = start + frame / fps;
    await evaluate(client, sessionId, `
      (() => {
        const api = window.KnowledgeVideoTemplate;
        api.pause();
        document.body.classList.add("static-frame");
        api.setCleanMode(true);
        api.seek(${time.toFixed(6)});
        return api.getState().currentTime;
      })()
    `);
    await evaluate(client, sessionId, "new Promise((resolve) => requestAnimationFrame(() => resolve(true)))", true);

    const screenshot = await client.send("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
      captureBeyondViewport: false,
      clip: {
        x: 0,
        y: 0,
        width,
        height,
        scale: 1
      }
    }, sessionId);

    const framePath = join(framesDir, `frame-${String(frame).padStart(6, "0")}.png`);
    await writeFile(framePath, Buffer.from(screenshot.data, "base64"));

    if (frame === 0 || frame + 1 === totalFrames || (frame + 1) % Math.max(1, fps) === 0) {
      process.stdout.write(`\rCaptured ${frame + 1}/${totalFrames} frames`);
    }
  }
  process.stdout.write("\n");
}

function runFfmpeg(options) {
  const {
    fps,
    framesDir,
    output,
    crf,
    preset
  } = options;

  return new Promise((resolveFfmpeg, rejectFfmpeg) => {
    const args = [
      "-y",
      "-framerate",
      String(fps),
      "-start_number",
      "0",
      "-i",
      join(framesDir, "frame-%06d.png"),
      "-c:v",
      "libx264",
      "-preset",
      String(preset),
      "-crf",
      String(crf),
      "-pix_fmt",
      "yuv420p",
      "-r",
      String(fps),
      "-movflags",
      "+faststart",
      output
    ];

    const ffmpeg = spawn("ffmpeg", args, {
      stdio: ["ignore", "ignore", "pipe"]
    });
    let stderr = "";

    ffmpeg.stderr.on("data", (data) => {
      stderr += String(data);
    });

    ffmpeg.once("error", rejectFfmpeg);
    ffmpeg.once("exit", (code) => {
      if (code === 0) {
        resolveFfmpeg();
      } else {
        rejectFfmpeg(new Error(`ffmpeg failed with exit code ${code}\n${stderr}`));
      }
    });
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const { width, height } = parseSize(options.size);
  const duration = readStoryDuration();
  const end = options.end ?? duration;
  const fps = Number(options.fps);
  const start = Number(options.start);
  const totalFrames = Math.round((end - start) * fps);

  if (!Number.isFinite(fps) || fps <= 0) {
    throw new Error("--fps must be a positive number.");
  }
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    throw new Error("--start and --end must describe a positive time range.");
  }
  if (totalFrames <= 0) {
    throw new Error("No frames to export.");
  }

  const chromePath = findChrome(options.chrome);
  const output = resolveFromRoot(options.output);
  const framesDir = options.framesDir
    ? resolveFromRoot(options.framesDir)
    : join(REPO_ROOT, ".export-frames", `005-${Date.now()}`);

  await mkdir(dirname(output), { recursive: true });

  let staticServer = null;
  let chrome = null;
  let client = null;

  try {
    staticServer = await startStaticServer(REPO_ROOT);
    const url = new URL(`${staticServer.origin}/${ENTRY}`);
    url.searchParams.set("clean", "1");
    url.searchParams.set("frame", "0");
    url.searchParams.set("fps", String(fps));

    console.log(`Rendering ${totalFrames} frames at ${width}x${height} / ${fps}fps`);
    console.log(`Serving ${url.toString()}`);

    chrome = await launchChrome(chromePath, width, height);
    client = new CdpClient(chrome.wsUrl);
    await client.connect();
    const { sessionId } = await createPage(client, url.toString(), width, height);

    await captureFrames(client, sessionId, {
      width,
      height,
      fps,
      start,
      totalFrames,
      framesDir
    });

    console.log("Encoding MP4 with ffmpeg...");
    await runFfmpeg({
      fps,
      framesDir,
      output,
      crf: options.crf,
      preset: options.preset
    });
    console.log(`Exported ${output}`);
  } finally {
    if (client) {
      client.close();
    }
    if (chrome) {
      await stopChrome(chrome);
    }
    if (staticServer) {
      staticServer.server.close();
    }
    if (!options.keepFrames) {
      await rm(framesDir, { recursive: true, force: true });
    }
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
