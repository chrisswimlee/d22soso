import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, appendFileSync } from "node:fs";
import { createWriteStream } from "node:fs";

const ROOT = "/Users/chrisswimlee/d22soso";
const WORK = ROOT + "/brag-output/work";
const FRAMES = WORK + "/frames";
const STILLS = WORK + "/stills";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9337;
const MODE = process.argv[2] || "stills";
const STILL_TIMES = [1.2, 2.3, 2.72, 3.5, 4.7, 6.2, 7.6, 9.3, 11.0, 12.4, 14.6, 15.8, 17.15, 19.0];

mkdirSync(FRAMES, { recursive: true });
mkdirSync(STILLS, { recursive: true });

const chromeLog = createWriteStream(WORK + "/chrome.log");
const chrome = spawn(CHROME, [
  "--headless=new",
  "--remote-debugging-port=" + PORT,
  "--remote-allow-origins=*",
  "--user-data-dir=" + WORK + "/chrome-profile",
  "--window-size=1920,1080",
  "--force-device-scale-factor=1",
  "--hide-scrollbars",
  "--mute-audio",
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-background-timer-throttling",
  "--disable-renderer-backgrounding",
  "--ignore-gpu-blocklist",
  "--enable-webgl",
  "--use-angle=metal",
  "about:blank",
], { stdio: ["ignore", "pipe", "pipe"] });
chrome.stdout.pipe(chromeLog);
chrome.stderr.pipe(chromeLog);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitJson(url) {
  for (let i = 0; i < 80; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return await r.json();
    } catch {}
    await sleep(150);
  }
  throw new Error("Chrome debugger did not come up. See work/chrome.log");
}

function cdp(ws) {
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)));
      else resolve(msg.result);
    }
  });
  return (method, params = {}) => new Promise((resolve, reject) => {
    const msgId = ++id;
    pending.set(msgId, { resolve, reject });
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });
}

async function main() {
  const ver = await waitJson("http://127.0.0.1:" + PORT + "/json/version");
  const list = await waitJson("http://127.0.0.1:" + PORT + "/json/list");
  const page = list.find((t) => t.type === "page") || list[0];
  console.log("targets", list.map((t) => ({ type: t.type, url: t.url, ws: !!t.webSocketDebuggerUrl })));
  const ws = new WebSocket(page.webSocketDebuggerUrl || ver.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve);
    ws.addEventListener("error", () => reject(new Error("ws error")));
  });
  const send = cdp(ws);
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false,
  });
  await send("Emulation.setDefaultBackgroundColorOverride", {
    color: { r: 7, g: 8, b: 11, a: 255 },
  });
  const nav = await send("Page.navigate", { url: "http://127.0.0.1:8765/brag-output/work/stage.html" });
  console.log("navigate", JSON.stringify(nav));

  let info = null;
  for (let i = 0; i < 80; i++) {
    await sleep(250);
    const res = await send("Runtime.evaluate", {
      expression: `({href:location.href, ready:!!window.__ready, err:window.__error||"", gl:window.__gl||"", fonts:!!window.__fonts, w:(document.getElementById("world")||{}).clientWidth||0, q:(window.__clock&&window.__clock.q.length)||0})`,
      returnByValue: true,
    });
    if (!res.result || res.result.value == null) {
      if (i === 0 || i === 10) console.log("eval pending", JSON.stringify(res).slice(0, 400));
      continue;
    }
    info = res.result.value;
    if (i < 2 || i === 8) console.log("poll", info);
    if (info.ready) {
      if (info.err) throw new Error(info.err);
      break;
    }
  }
  if (!info?.ready) throw new Error("stage never ready " + JSON.stringify(info));
  appendFileSync(WORK + "/capture.log", "ready " + JSON.stringify(info) + "\n");
  console.log("ready", info);

  const total = 600;
  const log = [];
  for (let i = 0; i < total; i++) {
    const t = (i + 1) / 30;
    const res = await send("Runtime.evaluate", {
      expression: `window.__frame(${t.toFixed(5)})`,
      returnByValue: true,
    });
    const state = res.result?.value;
    const want = MODE === "all" || STILL_TIMES.some((s) => Math.abs(s - t) < 1 / 60);
    if (!want) continue;
    const shot = await send("Page.captureScreenshot", {
      format: "jpeg",
      quality: MODE === "all" ? 92 : 90,
      clip: { x: 0, y: 0, width: 1920, height: 1080, scale: 1 },
    });
    const buf = Buffer.from(shot.data, "base64");
    const name = String(i).padStart(4, "0") + ".jpg";
    if (MODE === "all") writeFileSync(FRAMES + "/" + name, buf);
    if (STILL_TIMES.some((s) => Math.abs(s - t) < 1 / 60)) {
      writeFileSync(STILLS + "/" + t.toFixed(2) + ".jpg", buf);
      log.push({ t: +t.toFixed(2), file: t.toFixed(2) + ".jpg", state });
      console.log("still", t.toFixed(2), state && state.mode, "zoom", state && state.zoom);
    }
    if (MODE === "all" && i % 30 === 0) console.log("frame", i, state && state.mode);
  }
  writeFileSync(WORK + "/stills.json", JSON.stringify(log, null, 2));
  console.log("done", MODE);
  ws.close();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
}).finally(() => {
  chrome.kill("SIGKILL");
});
