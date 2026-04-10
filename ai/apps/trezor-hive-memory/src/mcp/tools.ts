import type { GraphService } from '@ai/graph-service';
import type { SessionStore } from '@ai/session-store';
import {
    GetDependencyImpactInputSchema,
    GetLearningInputSchema,
    RecallLearningsInputSchema,
    RecallRelatedInputSchema,
    SaveSessionInputSchema,
    StoreSessionLearningInputSchema,
} from '@ai/shared-types';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

/**
 * Create and configure the MCP server with tools that share the same
 * service layer as the REST API.
 */
export function createMcpServer(graphService: GraphService, sessionStore: SessionStore): McpServer {
    const server = new McpServer({
        name: 'ai-trezor-hive-memory',
        version: '0.2.0',
    });

    // ── Tool: get_dependency_impact ───────────────────────────
    server.tool(
        'get_dependency_impact',
        'Analyse transitive dependency impact of a symbol or package in the monorepo graph',
        {
            symbol: GetDependencyImpactInputSchema.shape.symbol,
            depth: GetDependencyImpactInputSchema.shape.depth,
        },
        async args => {
            const parsed = GetDependencyImpactInputSchema.parse(args);
            const result = await graphService.getDependencyImpact(parsed);

            return {
                content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
            };
        },
    );

    // ── Tool: store_session_learning ──────────────────────────
    server.tool(
        'store_session_learning',
        'Store a learning or insight from the current session into the knowledge graph and session store',
        {
            summary: StoreSessionLearningInputSchema.shape.summary,
            detail: StoreSessionLearningInputSchema.shape.detail,
            tags: StoreSessionLearningInputSchema.shape.tags,
            engineerId: StoreSessionLearningInputSchema.shape.engineerId,
            relatedSymbols: StoreSessionLearningInputSchema.shape.relatedSymbols,
        },
        async args => {
            const parsed = StoreSessionLearningInputSchema.parse(args);
            const { summary, detail, tags, engineerId, relatedSymbols } = parsed;

            const [pgResult, graphResult] = await Promise.all([
                sessionStore.storeLearning({ summary, detail, tags, engineerId }),
                graphService.storeLearning({ summary, detail, tags, engineerId }, relatedSymbols),
            ]);

            return {
                content: [
                    {
                        type: 'text' as const,
                        text: JSON.stringify(
                            {
                                id: pgResult.id,
                                graphId: graphResult.id,
                                summary: pgResult.summary,
                                createdAt: pgResult.createdAt,
                            },
                            null,
                            2,
                        ),
                    },
                ],
            };
        },
    );

    // ── Tool: recall_learnings ────────────────────────────────
    server.tool(
        'recall_learnings',
        'Search stored learnings by full-text query, tags, engineer, or date. Returns a compact list for progressive disclosure — use get_learning for full detail.',
        {
            query: RecallLearningsInputSchema.shape.query,
            tags: RecallLearningsInputSchema.shape.tags,
            engineerId: RecallLearningsInputSchema.shape.engineerId,
            since: RecallLearningsInputSchema.shape.since,
            limit: RecallLearningsInputSchema.shape.limit,
            offset: RecallLearningsInputSchema.shape.offset,
        },
        async args => {
            const parsed = RecallLearningsInputSchema.parse(args);
            const result = await sessionStore.searchLearnings(parsed);

            return {
                content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
            };
        },
    );

    // ── Tool: get_learning ───────────────────────────────────
    server.tool(
        'get_learning',
        'Get full details of a single learning by its UUID. Use after recall_learnings to fetch detail and context.',
        {
            id: GetLearningInputSchema.shape.id,
        },
        async args => {
            const parsed = GetLearningInputSchema.parse(args);
            const result = await sessionStore.getLearning(parsed.id);

            if (!result) {
                return {
                    content: [{ type: 'text' as const, text: `Learning ${parsed.id} not found` }],
                    isError: true,
                };
            }

            return {
                content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
            };
        },
    );

    // ── Tool: session_save ───────────────────────────────────
    server.tool(
        'session_save',
        'Save a structured session summary. Call at end of session for continuity — captures what was done and what should happen next.',
        {
            title: SaveSessionInputSchema.shape.title,
            summary: SaveSessionInputSchema.shape.summary,
            nextSteps: SaveSessionInputSchema.shape.nextSteps,
            engineerId: SaveSessionInputSchema.shape.engineerId,
            tags: SaveSessionInputSchema.shape.tags,
            learningIds: SaveSessionInputSchema.shape.learningIds,
        },
        async args => {
            const parsed = SaveSessionInputSchema.parse(args);
            const result = await sessionStore.saveSession(parsed);

            return {
                content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
            };
        },
    );

    // ── Tool: recall_related ─────────────────────────────────
    server.tool(
        'recall_related',
        'Traverse the Neo4j knowledge graph from a learning or symbol to find related learnings, symbols, and engineers. Unlocks cross-referencing between stored knowledge.',
        {
            learningId: RecallRelatedInputSchema.shape.learningId,
            symbol: RecallRelatedInputSchema.shape.symbol,
            depth: RecallRelatedInputSchema.shape.depth,
        },
        async args => {
            const parsed = RecallRelatedInputSchema.parse(args);

            if (!parsed.learningId && !parsed.symbol) {
                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: 'At least one of learningId or symbol must be provided',
                        },
                    ],
                    isError: true,
                };
            }

            const result = await graphService.recallRelated(parsed);

            return {
                content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
            };
        },
    );

    return server;
}
