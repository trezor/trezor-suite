import { GraphService } from '@ai/graph-service';
import { SessionStore } from '@ai/session-store';
import fastifyStatic from '@fastify/static';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import Fastify from 'fastify';
import { randomUUID } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createMcpServer } from './mcp/tools.js';
import { createAuditLogger } from './middleware/audit-logger.js';
import { jwtAuth } from './middleware/jwt-auth.js';
import { registerRestRoutes } from './routes/rest.js';

// ── Environment ───────────────────────────────────────────────

const PORT = Number(process.env.GATEWAY_PORT) || 8080;
const HOST = process.env.GATEWAY_HOST ?? '0.0.0.0';
const LOG_LEVEL = process.env.LOG_LEVEL ?? 'info';

const AUDIT_RETENTION_DAYS = Number(process.env.AUDIT_RETENTION_DAYS) || 90;
const PURGE_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ── Services ──────────────────────────────────────────────────

const graphService = new GraphService(
    process.env.NEO4J_URI ?? 'bolt://localhost:7687',
    process.env.NEO4J_USER ?? 'neo4j',
    process.env.NEO4J_PASSWORD ?? 'neo4j',
);

const sessionStore = new SessionStore({
    host: process.env.POSTGRES_HOST ?? 'localhost',
    port: Number(process.env.POSTGRES_PORT) || 5432,
    user: process.env.POSTGRES_USER ?? 'memory',
    password: process.env.POSTGRES_PASSWORD ?? 'memory',
    database: process.env.POSTGRES_DB ?? 'trezor_hive_memory',
});

// ── Fastify app ───────────────────────────────────────────────

const app = Fastify({
    logger: { level: LOG_LEVEL },
    genReqId: () => randomUUID(),
});

// JWT auth (skip for /api/health, /mcp, and /ui static assets)
app.addHook('onRequest', async (request, reply) => {
    if (request.url === '/api/health' || request.url === '/mcp' || request.url.startsWith('/ui')) return;
    await jwtAuth(request, reply);
});

// Audit logging
app.addHook('onResponse', createAuditLogger(sessionStore));

// ── Admin UI (static files) ──────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

await app.register(fastifyStatic, {
    root: join(__dirname, '..', 'public'),
    prefix: '/ui/',
});

app.get('/ui', async (_req, reply) => {
    reply.redirect('/ui/');
});

// ── MCP Streamable HTTP endpoint ──────────────────────────────

// Track transports and their paired MCP servers by session ID
const sessions = new Map<string, { transport: StreamableHTTPServerTransport; server: McpServer }>();

app.post('/mcp', async (request, reply) => {
    const sessionId = request.headers['mcp-session-id'] as string | undefined;

    let transport: StreamableHTTPServerTransport;

    if (sessionId && sessions.has(sessionId)) {
        transport = sessions.get(sessionId)!.transport;
    } else {
        // Each session gets its own McpServer + transport pair
        const mcpServer = createMcpServer(graphService, sessionStore);

        transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: id => {
                sessions.set(id, { transport, server: mcpServer });
            },
        });

        transport.onclose = () => {
            const id = transport.sessionId;
            if (id) sessions.delete(id);
        };

        await mcpServer.connect(transport);
    }

    const nodeReq = request.raw;
    const nodeRes = reply.raw;

    await transport.handleRequest(nodeReq, nodeRes, request.body);

    reply.hijack();
});

app.get('/mcp', async (request, reply) => {
    const sessionId = request.headers['mcp-session-id'] as string | undefined;

    if (!sessionId || !sessions.has(sessionId)) {
        reply.code(400).send({ error: 'Missing or invalid mcp-session-id header' });

        return;
    }

    const { transport } = sessions.get(sessionId)!;
    const nodeReq = request.raw;
    const nodeRes = reply.raw;

    await transport.handleRequest(nodeReq, nodeRes);

    reply.hijack();
});

app.delete('/mcp', async (request, reply) => {
    const sessionId = request.headers['mcp-session-id'] as string | undefined;

    if (!sessionId || !sessions.has(sessionId)) {
        reply.code(400).send({ error: 'Missing or invalid mcp-session-id header' });

        return;
    }

    const { transport } = sessions.get(sessionId)!;
    const nodeReq = request.raw;
    const nodeRes = reply.raw;

    await transport.handleRequest(nodeReq, nodeRes);

    reply.hijack();
});

// ── REST routes ───────────────────────────────────────────────

await registerRestRoutes(app, graphService, sessionStore);

// ── Start ─────────────────────────────────────────────────────

let purgeTimer: ReturnType<typeof setInterval> | undefined;

async function start(): Promise<void> {
    try {
        // Run migrations
        app.log.info('Running database migrations…');
        await Promise.all([graphService.migrate(), sessionStore.migrate()]);
        app.log.info('Migrations complete');

        // Purge stale audit events on startup and then every 24h
        const purged = await sessionStore.purgeAuditEvents(AUDIT_RETENTION_DAYS);
        app.log.info({ purged, retentionDays: AUDIT_RETENTION_DAYS }, 'Audit event purge complete');

        purgeTimer = setInterval(async () => {
            try {
                const count = await sessionStore.purgeAuditEvents(AUDIT_RETENTION_DAYS);
                app.log.info({ purged: count }, 'Scheduled audit event purge complete');
            } catch (err) {
                app.log.error({ err }, 'Scheduled audit event purge failed');
            }
        }, PURGE_INTERVAL_MS);

        await app.listen({ port: PORT, host: HOST });
        app.log.info(`Trezor Hive Memory listening on http://${HOST}:${PORT}`);
        app.log.info(`MCP endpoint: http://${HOST}:${PORT}/mcp`);
        app.log.info(`REST API: http://${HOST}:${PORT}/api/*`);
        app.log.info(`Admin UI: http://${HOST}:${PORT}/ui`);
    } catch (err) {
        app.log.fatal(err);
        process.exit(1);
    }
}

// Graceful shutdown
for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, async () => {
        app.log.info(`Received ${signal}, shutting down…`);
        clearInterval(purgeTimer);
        await app.close();
        await graphService.close();
        await sessionStore.close();
        process.exit(0);
    });
}

start();
