// Build-report screenshots: every screen of the game at 1440x900 and 375x812, from headless Chrome over CDP.
// Usage: node scripts/screens.mjs <outdir> [base=http://localhost:3077]
// Needs Node 22 (built-in WebSocket) and Google Chrome on this Mac. Nothing is installed.
import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const [outDir = "screens", base = "http://localhost:3077"] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const port = 9400 + Math.floor(Math.random() * 400);
const profile = mkdtempSync(path.join(tmpdir(), "mn-cdp-"));
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--hide-scrollbars", "--mute-audio", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 50 && !target; i++) { try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page"); } catch {} if (!target) await sleep(200); }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
let id = 0; const pending = new Map();
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const run = (expr) => send("Runtime.evaluate", { expression: expr, awaitPromise: true });
await send("Page.enable"); await send("Runtime.enable");

// Each step: a name and a script that moves the page into that state. The page is reloaded per width.
const STEPS = [
  ["lobby", ``],
  ["lobby-alexa-open", `document.getElementById("btnAlexa").click()`],
  ["deal-prompt", `document.getElementById("btnAlexaClose").click(); ["Katie","Michael","Ann","Rain"].forEach((n,i)=>document.getElementById("p"+i).value=n); document.getElementById("btnStart").click()`],
  ["deal-role", `document.getElementById("btnPeek").click()`],
  ["host-intro", `document.querySelector("#roleBody button").click(); for (let i=0;i<3;i++){document.getElementById("btnPeek").click(); document.querySelector("#roleBody button").click();}`],
  ["round-1", `document.getElementById("btnHostNext").click(); document.getElementById("inspectorQ").value="Where was everyone at 11:45?"; document.getElementById("btnAsk").click(); new Promise(r=>setTimeout(r,1500))`],
  ["host-round-2", `document.getElementById("btnEndRound").click()`],
  ["round-2", `document.getElementById("btnHostNext").click(); document.getElementById("inspectorQ").value="Who wears a volunteer apron?"; document.getElementById("btnAsk").click(); new Promise(r=>setTimeout(r,1500))`],
  ["accuse", `document.getElementById("btnEndRound").click(); document.querySelectorAll("#accuseGrid button")[2].click()`],
  ["reveal", `document.getElementById("btnReveal").click()`],
  ["restart-confirm", `document.getElementById("btnHome").click()`],
];
for (const [width, height] of [[1440, 900], [375, 812]]) {
  const mobile = width < 768;
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile });
  if (mobile) await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  await send("Page.navigate", { url: base + "/" }); await sleep(2500);
  await run(`localStorage.setItem("mn-voice","off"); document.getElementById("voiceOn").checked=false`);
  let n = 0;
  for (const [name, script] of STEPS) {
    if (script) await run(script);
    await sleep(500);
    const shot = await send("Page.captureScreenshot", { format: "png" });
    const file = path.join(outDir, `${String(++n).padStart(2, "0")}-${name}-${width}.png`);
    writeFileSync(file, Buffer.from(shot.result.data, "base64")); console.log(file);
  }
}
ws.close(); chrome.kill();
