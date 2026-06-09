import { z } from 'zod';

export const TestToValidateSchema = z.object({
    platform: z.enum(['web', 'desktop']),
    group: z.string(),
    spec: z.string(),
});

export const SkipReasonSchema = z.enum([
    'PRODUCT_BUG',
    'INFRASTRUCTURE',
    'FIX_FAILED',
    'FIX_DELIVERED',
]);

export const FixTaskSchema = z.object({
    id: z
        .string()
        .regex(/^fix-\d{3}$/)
        .refine(v => !/[\r\n]/.test(v), 'id must not contain newlines'),
    branch: z
        .string()
        .regex(/^fix\/nightly-\d{4}-\d{2}-\d{2}-[a-z0-9-]{1,40}$/)
        .refine(v => !/[\r\n]/.test(v), 'branch must not contain newlines'),
    rootCause: z.string(),
    confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
    analysis: z.string(),
    validations: z.array(TestToValidateSchema),
});

export const SkippedTaskSchema = z.object({
    rootCause: z.string(),
    reason: SkipReasonSchema,
    validations: z.array(TestToValidateSchema),
});

export const AnalysisReportSchema = z.object({
    runDate: z.string(),
    webRunId: z.string().nullable(),
    desktopRunId: z.string().nullable(),
    fixTasks: z.array(FixTaskSchema),
    skipped: z.array(SkippedTaskSchema),
});

export const FixResultSchema = z.object({
    taskId: z.string(),
    result: z.enum(['pass', 'partial', 'fail', 'not_duplicated']),
    passed: z.array(z.string()),
    failed: z.array(z.string()),
    iterations: z.number().int().nonnegative(),
    prTitle: z.string(),
});

export const ClaudeUsageSchema = z.object({
    input_tokens: z.number().optional(),
    output_tokens: z.number().optional(),
    cache_creation_input_tokens: z.number().optional(),
    cache_read_input_tokens: z.number().optional(),
});

export const ClaudeResultSchema = z.object({
    type: z.string().optional(),
    subtype: z.string().optional(),
    result: z.string().optional(),
    structured_output: z.unknown().optional(),
    num_turns: z.number().optional(),
    usage: ClaudeUsageSchema.optional(),
    total_cost_usd: z.number().optional(),
    duration_ms: z.number().optional(),
});

export const SlackFixSummarySchema = FixResultSchema.extend({
    prUrl: z.string().nullable(),
    costUsd: z.number().nullable(),
});

// ── Cross-run ledger ─────────────────────────────────────────────────────────
// Persistent memory of recurring failures so consecutive nightly runs don't
// re-attempt or re-deliver the same root causes. State is "negative knowledge"
// only — entries are pruned the moment their failure stops recurring (a passing
// test is the sole signal of resolution; merged/closed PR state is never read).

export const LedgerEntrySchema = z.object({
    reason: SkipReasonSchema,
    rootCause: z.string(),
    validations: z.array(TestToValidateSchema),
});

export const LedgerSchema = z.object({
    version: z.literal(1),
    updatedAt: z.string(),
    entries: z.array(LedgerEntrySchema),
});

export type AnalysisReport = z.infer<typeof AnalysisReportSchema>;
export type FixResult = z.infer<typeof FixResultSchema>;
export type SlackFixSummary = z.infer<typeof SlackFixSummarySchema>;
export type ClaudeResult = z.infer<typeof ClaudeResultSchema>;
export type SkipReason = z.infer<typeof SkipReasonSchema>;
export type LedgerEntry = z.infer<typeof LedgerEntrySchema>;
export type Ledger = z.infer<typeof LedgerSchema>;

// Strip the top-level `$schema` which breaks Agent's attempt of JSON output
const toCliJsonSchema = (schema: z.ZodType) => {
    const jsonSchema = z.toJSONSchema(schema);
    delete jsonSchema.$schema;

    return jsonSchema;
};

export const AnalysisReportJsonSchema = toCliJsonSchema(AnalysisReportSchema);
export const FixResultJsonSchema = toCliJsonSchema(FixResultSchema);
