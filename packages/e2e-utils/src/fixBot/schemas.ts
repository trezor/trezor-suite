import { z } from 'zod';

export const TestToValidateSchema = z.object({
    platform: z.enum(['web', 'desktop']),
    group: z.string(),
    spec: z.string(),
});

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
    fixScope: z.enum(['TEST_CODE', 'LOCATOR_ADD']),
    confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
    fixDescription: z.string(),
    diagnosis: z.string(),
    validations: z.array(TestToValidateSchema),
});

export const SkippedTaskSchema = z.object({
    rootCause: z.string(),
    reason: z.string(),
    affectedTests: z.array(z.string()),
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

export type FixResult = z.infer<typeof FixResultSchema>;
export type ClaudeResult = z.infer<typeof ClaudeResultSchema>;

export const AnalysisReportJsonSchema = z.toJSONSchema(AnalysisReportSchema);
export const FixResultJsonSchema = z.toJSONSchema(FixResultSchema);
