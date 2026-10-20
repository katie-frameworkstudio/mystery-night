// Local dev server: serves public/ and mounts api/inspector.js at /api/inspector, no Vercel account needed.
// Run: npm run dev   (PORT=3077 by default)
import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import handler from "../api/inspector.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".json": "application/json", ".txt": "text/plain" };
const port = Number(process.env.PORT) || 3077;

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/api/inspector") return handler(req, res);
  let file = path.normalize(path.join(root, url.pathname === "/" ? "index.html" : url.pathname));
  if (!file.startsWith(root)) { res.statusCode = 403; return res.end(); }
  try {
    if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
    res.setHeader("Content-Type", types[path.extname(file)] || "application/octet-stream");
    res.end(await readFile(file));
  } catch {
    res.statusCode = 404; res.end("Not found");
  }
}).listen(port, () => console.log(`Mystery Night on http://localhost:${port}`));
