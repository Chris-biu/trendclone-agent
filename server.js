const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { generateWithOpenAICompatible, buildFallbackPackage } = require("./server/agent-core");

const rootDir = __dirname;
const port = Number(process.env.PORT) || 5179;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".md": "text/markdown; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
};

function loadEnvFile(filePath = path.join(rootDir, ".env")) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (!process.env[key]) {
      process.env[key] = rest.join("=").replace(/^["']|["']$/g, "");
    }
  }
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy(new Error("Request body too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function safeStaticPath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const normalized = decoded === "/" ? "/index.html" : decoded;
  const filePath = path.join(rootDir, normalized);
  if (!filePath.startsWith(rootDir)) {
    return null;
  }
  return filePath;
}

async function handleGenerate(req, res) {
  try {
    const inputs = await readJsonBody(req);
    let packageResult;
    let mode = "ai";

    try {
      packageResult = await generateWithOpenAICompatible(inputs);
      mode = packageResult.provider === "local-fallback" ? "fallback" : "ai";
    } catch (error) {
      packageResult = buildFallbackPackage(inputs);
      packageResult.warning = error.message;
      mode = "fallback-after-error";
    }

    sendJson(res, 200, {
      ok: true,
      mode,
      data: packageResult,
    });
  } catch (error) {
    sendJson(res, 400, {
      ok: false,
      error: error.message,
    });
  }
}

function serveStatic(req, res) {
  const filePath = safeStaticPath(req.url);
  if (!filePath) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
    });
    res.end(data);
  });
}

loadEnvFile();

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/api/generate") {
    handleGenerate(req, res);
    return;
  }

  if (req.method === "GET") {
    serveStatic(req, res);
    return;
  }

  res.writeHead(405);
  res.end("Method not allowed");
});

if (require.main === module) {
  server.listen(port, () => {
    console.log(`TrendClone Agent running at http://127.0.0.1:${port}`);
  });
}

module.exports = {
  loadEnvFile,
  server,
};
