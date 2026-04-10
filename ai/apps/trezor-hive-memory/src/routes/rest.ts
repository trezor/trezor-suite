import type { GraphService } from '@ai/graph-service';
import type { SessionStore } from '@ai/session-store';
import {
    GetDependencyImpactInputSchema,
    GetLearningInputSchema,
    RecallLearningsInputSchema,
    RecallRelatedInputSchema,
    SaveSessionInputSchema,
    StoreSessionLearningInputSchema,
    UpdateLearningInputSchema,
} from '@ai/shared-types';
import type { FastifyInstance } from 'fastify';

export async function registerRestRoutes(
    app: FastifyInstance,
    graphService: GraphService,
    sessionStore: SessionStore,
): Promise<void> {
    // GET /api/health
    app.get('/api/health', async (_req, reply) => {
        const [neo4j, postgres] = await Promise.all([
            graphService.healthCheck(),
            sessionStore.healthCheck(),
        ]);

        const status = neo4j && postgres ? 'ok' : neo4j || postgres ? 'degraded' : 'down';

        reply.code(status === 'down' ? 503 : 200).send({
            status,
            neo4j,
            postgres,
            uptime: process.uptime(),
        });
    });

    // GET /api/impact?symbol=...&depth=...
    app.get('/api/impact', async (req, reply) => {
        const query = req.query as Record<string, string>;
        const parsed = GetDependencyImpactInputSchema.safeParse({
            symbol: query.symbol,
            depth: query.depth ? Number(query.depth) : undefined,
        });

        if (!parsed.success) {
            reply.code(400).send({ error: parsed.error.flatten() });

            return;
        }

        const result = await graphService.getDependencyImpact(parsed.data);
        reply.send(result);
    });

    // POST /api/learn
    app.post('/api/learn', async (req, reply) => {
        const parsed = StoreSessionLearningInputSchema.safeParse(req.body);

        if (!parsed.success) {
            reply.code(400).send({ error: parsed.error.flatten() });

            return;
        }

        const { summary, detail, tags, engineerId, relatedSymbols } = parsed.data;

        const [pgResult, graphResult] = await Promise.all([
            sessionStore.storeLearning({ summary, detail, tags, engineerId }),
            graphService.storeLearning({ summary, detail, tags, engineerId }, relatedSymbols),
        ]);

        reply.code(201).send({
            id: pgResult.id,
            graphId: graphResult.id,
            summary: pgResult.summary,
            createdAt: pgResult.createdAt,
        });
    });

    // GET /api/learnings?q=...&tags=...&engineer=...&since=...&limit=...&offset=...
    app.get('/api/learnings', async (req, reply) => {
        const query = req.query as Record<string, string>;
        const parsed = RecallLearningsInputSchema.safeParse({
            query: query.q || undefined,
            tags: query.tags ? query.tags.split(',') : undefined,
            engineerId: query.engineer || undefined,
            since: query.since || undefined,
            limit: query.limit ? Number(query.limit) : undefined,
            offset: query.offset ? Number(query.offset) : undefined,
        });

        if (!parsed.success) {
            reply.code(400).send({ error: parsed.error.flatten() });

            return;
        }

        const result = await sessionStore.searchLearnings(parsed.data);
        reply.send(result);
    });

    // GET /api/learnings/:id
    app.get('/api/learnings/:id', async (req, reply) => {
        const { id } = req.params as { id: string };
        const parsed = GetLearningInputSchema.safeParse({ id });

        if (!parsed.success) {
            reply.code(400).send({ error: parsed.error.flatten() });

            return;
        }

        const result = await sessionStore.getLearning(parsed.data.id);

        if (!result) {
            reply.code(404).send({ error: 'Learning not found' });

            return;
        }

        reply.send(result);
    });

    // PUT /api/learnings/:id
    app.put('/api/learnings/:id', async (req, reply) => {
        const { id } = req.params as { id: string };
        const idParsed = GetLearningInputSchema.safeParse({ id });

        if (!idParsed.success) {
            reply.code(400).send({ error: idParsed.error.flatten() });

            return;
        }

        const bodyParsed = UpdateLearningInputSchema.safeParse(req.body);

        if (!bodyParsed.success) {
            reply.code(400).send({ error: bodyParsed.error.flatten() });

            return;
        }

        const updated = await sessionStore.updateLearning(idParsed.data.id, bodyParsed.data);

        if (!updated) {
            reply.code(404).send({ error: 'Learning not found' });

            return;
        }

        await graphService.updateLearning(idParsed.data.id, bodyParsed.data);
        reply.send(updated);
    });

    // DELETE /api/learnings/:id
    app.delete('/api/learnings/:id', async (req, reply) => {
        const { id } = req.params as { id: string };
        const parsed = GetLearningInputSchema.safeParse({ id });

        if (!parsed.success) {
            reply.code(400).send({ error: parsed.error.flatten() });

            return;
        }

        const [pgDeleted] = await Promise.all([
            sessionStore.deleteLearning(parsed.data.id),
            graphService.deleteLearning(parsed.data.id),
        ]);

        if (!pgDeleted) {
            reply.code(404).send({ error: 'Learning not found' });

            return;
        }

        reply.code(204).send();
    });

    // GET /api/graph?limit=...
    app.get('/api/graph', async (req, reply) => {
        const query = req.query as Record<string, string>;
        const limit = Math.min(Number(query.limit) || 500, 2000);
        const result = await graphService.getFullGraph(limit);
        reply.send(result);
    });

    // POST /api/sessions
    app.post('/api/sessions', async (req, reply) => {
        const parsed = SaveSessionInputSchema.safeParse(req.body);

        if (!parsed.success) {
            reply.code(400).send({ error: parsed.error.flatten() });

            return;
        }

        const result = await sessionStore.saveSession(parsed.data);
        reply.code(201).send(result);
    });

    // GET /api/sessions?limit=...
    app.get('/api/sessions', async (req, reply) => {
        const query = req.query as Record<string, string>;
        const limit = query.limit ? Number(query.limit) : 10;
        const result = await sessionStore.getRecentSessions(limit);
        reply.send(result);
    });

    // GET /api/related?learningId=...&symbol=...&depth=...
    app.get('/api/related', async (req, reply) => {
        const query = req.query as Record<string, string>;
        const parsed = RecallRelatedInputSchema.safeParse({
            learningId: query.learningId || undefined,
            symbol: query.symbol || undefined,
            depth: query.depth ? Number(query.depth) : undefined,
        });

        if (!parsed.success) {
            reply.code(400).send({ error: parsed.error.flatten() });

            return;
        }

        if (!parsed.data.learningId && !parsed.data.symbol) {
            reply.code(400).send({ error: 'At least one of learningId or symbol is required' });

            return;
        }

        const result = await graphService.recallRelated(parsed.data);
        reply.send(result);
    });
}
