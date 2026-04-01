import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { URL } from "node:url";
import { ensureRuntimeLayout, FRONTEND_DIR, PORT } from "./config.mjs";
import {
  createSession,
  getSession,
  listAvailableSkills,
  listSessions,
  processUserMessage,
} from "./agent.mjs";
import { listModels } from "./ollama.mjs";
import { createWorkspaceBootstrapFile, getWorkspaceSummary } from "./workspace.mjs";

ensureRuntimeLayout();
createWorkspaceBootstrapFile();

const eventStreams = new Map();

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload, null, 2));
}

function sendText(response, statusCode, contentType, payload) {
  response.writeHead(statusCode, {
    "Content-Type": contentType,
  });
  response.end(payload);
}

function notFound(response) {
  sendJson(response, 404, { error: "Not found" });
}

async function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk.toString();
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

function broadcast(sessionId, event, payload) {
  const clients = eventStreams.get(sessionId) ?? [];
  const frame = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const response of clients) {
    response.write(frame);
  }
}

function addStream(sessionId, response) {
  const clients = eventStreams.get(sessionId) ?? [];
  clients.push(response);
  eventStreams.set(sessionId, clients);
}

function removeStream(sessionId, response) {
  const clients = eventStreams.get(sessionId) ?? [];
  eventStreams.set(
    sessionId,
    clients.filter((client) => client !== response),
  );
}

function serveFrontendAsset(response, pathname) {
  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\//, "");
  const fullPath = path.join(FRONTEND_DIR, relative);
  if (!fullPath.startsWith(FRONTEND_DIR) || !fs.existsSync(fullPath)) {
    notFound(response);
    return;
  }

  const extension = path.extname(fullPath);
  const contentType = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
  }[extension] ?? "application/octet-stream";

  sendText(response, 200, contentType, fs.readFileSync(fullPath));
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const { pathname } = url;

  try {
    if (request.method === "GET" && pathname === "/api/health") {
      return sendJson(response, 200, {
        status: "ok",
        workspace: getWorkspaceSummary("default"),
      });
    }

    if (request.method === "GET" && pathname === "/api/models") {
      const models = await listModels();
      return sendJson(response, 200, { models });
    }

    if (request.method === "GET" && pathname === "/api/skills") {
      return sendJson(response, 200, { skills: listAvailableSkills() });
    }

    if (request.method === "GET" && pathname === "/api/sessions") {
      return sendJson(response, 200, { sessions: listSessions() });
    }

    if (request.method === "POST" && pathname === "/api/sessions") {
      const body = await readBody(request);
      const session = createSession({
        title: body.title,
        model: body.model,
        workspaceName: body.workspaceName || "default",
      });
      return sendJson(response, 201, { session });
    }

    if (request.method === "GET" && /^\/api\/sessions\/[^/]+$/.test(pathname)) {
      const sessionId = pathname.split("/").at(-1);
      const session = getSession(sessionId);
      if (!session) {
        return notFound(response);
      }
      return sendJson(response, 200, { session });
    }

    if (request.method === "GET" && /^\/api\/sessions\/[^/]+\/events$/.test(pathname)) {
      const sessionId = pathname.split("/")[3];
      const session = getSession(sessionId);
      if (!session) {
        return notFound(response);
      }

      response.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });
      response.write(`event: ready\ndata: ${JSON.stringify({ sessionId })}\n\n`);
      addStream(sessionId, response);
      request.on("close", () => removeStream(sessionId, response));
      return;
    }

    if (request.method === "POST" && /^\/api\/sessions\/[^/]+\/messages$/.test(pathname)) {
      const sessionId = pathname.split("/")[3];
      const body = await readBody(request);
      const session = await processUserMessage(
        sessionId,
        {
          prompt: body.prompt ?? "",
          model: body.model,
          skillIds: Array.isArray(body.skillIds) ? body.skillIds : [],
        },
        (event, payload) => broadcast(sessionId, event, payload),
      );
      return sendJson(response, 200, { session });
    }

    if (pathname === "/" || pathname === "/app.js" || pathname === "/styles.css") {
      return serveFrontendAsset(response, pathname);
    }

    return notFound(response);
  } catch (error) {
    return sendJson(response, 500, {
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

server.listen(PORT, () => {
  console.log(`Code Agent listening on http://localhost:${PORT}`);
});
