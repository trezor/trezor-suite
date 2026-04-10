import { z } from 'zod';

// ── Graph node schemas ────────────────────────────────────────

export const PackageNodeSchema = z.object({
    name: z.string(),
    version: z.string().optional(),
    path: z.string().optional(),
});
export type PackageNode = z.infer<typeof PackageNodeSchema>;

export const SymbolNodeSchema = z.object({
    name: z.string(),
    kind: z.enum(['function', 'class', 'type', 'variable', 'module']),
    filePath: z.string(),
    packageName: z.string().optional(),
});
export type SymbolNode = z.infer<typeof SymbolNodeSchema>;

export const EngineerNodeSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email().optional(),
});
export type EngineerNode = z.infer<typeof EngineerNodeSchema>;

export const LearningEventNodeSchema = z.object({
    id: z.string().uuid().optional(),
    summary: z.string(),
    detail: z.string().optional(),
    tags: z.array(z.string()).default([]),
    engineerId: z.string().optional(),
    createdAt: z.string().datetime().optional(),
});
export type LearningEventNode = z.infer<typeof LearningEventNodeSchema>;

// ── MCP tool input schemas ────────────────────────────────────

export const GetDependencyImpactInputSchema = z.object({
    symbol: z.string().describe('Fully-qualified symbol name or package name to analyse'),
    depth: z.number().int().min(1).max(10).default(3).describe('Max traversal depth'),
});
export type GetDependencyImpactInput = z.infer<typeof GetDependencyImpactInputSchema>;

export const StoreSessionLearningInputSchema = z.object({
    summary: z.string().min(1).describe('Short summary of the learning'),
    detail: z.string().optional().describe('Extended detail / context'),
    tags: z.array(z.string()).default([]).describe('Categorisation tags'),
    engineerId: z.string().optional().describe('Engineer who produced the learning'),
    relatedSymbols: z.array(z.string()).default([]).describe('Symbols involved'),
});
export type StoreSessionLearningInput = z.infer<typeof StoreSessionLearningInputSchema>;

export const RecallLearningsInputSchema = z.object({
    query: z.string().optional().describe('Full-text search query'),
    tags: z.array(z.string()).optional().describe('Filter by tags (AND match)'),
    engineerId: z.string().optional().describe('Filter by engineer'),
    since: z.string().optional().describe('ISO 8601 date — only return learnings after this date'),
    limit: z.number().int().min(1).max(100).default(20).describe('Max results'),
    offset: z.number().int().min(0).default(0).describe('Pagination offset'),
});
export type RecallLearningsInput = z.infer<typeof RecallLearningsInputSchema>;

export const GetLearningInputSchema = z.object({
    id: z.string().uuid().describe('Learning UUID'),
});
export type GetLearningInput = z.infer<typeof GetLearningInputSchema>;

export const SaveSessionInputSchema = z.object({
    title: z.string().min(1).describe('Short title summarising the session'),
    summary: z.string().min(1).describe('What was done in this session'),
    nextSteps: z.array(z.string()).default([]).describe('What should be done next'),
    engineerId: z.string().optional().describe('Engineer who ran the session'),
    tags: z.array(z.string()).default([]).describe('Categorisation tags'),
    learningIds: z.array(z.string().uuid()).default([]).describe('Learnings produced during this session'),
});
export type SaveSessionInput = z.infer<typeof SaveSessionInputSchema>;

export const RecallRelatedInputSchema = z.object({
    learningId: z.string().uuid().optional().describe('Start traversal from this learning'),
    symbol: z.string().optional().describe('Start traversal from this symbol name'),
    depth: z.number().int().min(1).max(5).default(2).describe('Max traversal depth'),
});
export type RecallRelatedInput = z.infer<typeof RecallRelatedInputSchema>;

export const UpdateLearningInputSchema = z.object({
    summary: z.string().min(1).optional().describe('Updated summary'),
    detail: z.string().optional().describe('Updated detail'),
    tags: z.array(z.string()).optional().describe('Updated tags'),
});
export type UpdateLearningInput = z.infer<typeof UpdateLearningInputSchema>;

// ── API response types ────────────────────────────────────────

export interface ImpactResult {
    symbol: string;
    depth: number;
    affectedPackages: string[];
    affectedSymbols: string[];
    graph: Array<{ from: string; to: string; relationship: string }>;
}

export interface LearningResult {
    id: string;
    summary: string;
    createdAt: string;
}

export interface LearningDetail extends LearningResult {
    detail: string | null;
    tags: string[];
    engineerId: string | null;
}

export interface LearningSearchResult {
    items: LearningDetail[];
    total: number;
    limit: number;
    offset: number;
}

export interface SessionResult {
    id: string;
    title: string;
    createdAt: string;
}

export interface SessionDetail extends SessionResult {
    summary: string;
    nextSteps: string[];
    engineerId: string | null;
    tags: string[];
    learningIds: string[];
}

export interface RelatedResult {
    learnings: Array<{
        id: string;
        summary: string;
        tags: string[];
        relationship: string;
    }>;
    symbols: Array<{
        name: string;
        kind: string;
        filePath: string;
        relationship: string;
    }>;
    engineers: Array<{
        id: string;
        relationship: string;
    }>;
}

export interface HealthStatus {
    status: 'ok' | 'degraded' | 'down';
    neo4j: boolean;
    postgres: boolean;
    uptime: number;
}

// ── Audit event ───────────────────────────────────────────────

export interface AuditEvent {
    id?: string;
    action: string;
    actor: string | null;
    payload: Record<string, unknown>;
    timestamp: string;
}

// ── Graph export (for Admin UI visualization) ─────────────────

export interface GraphExport {
    nodes: Array<{ id: string; label: string; type: string; properties: Record<string, unknown> }>;
    edges: Array<{ from: string; to: string; relationship: string }>;
}
