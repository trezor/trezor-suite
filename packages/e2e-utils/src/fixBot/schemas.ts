import { z } from 'zod';

export const TestToValidateSchema = z.object({
    platform: z.enum(['web', 'desktop']),
    group: z.string(),
    spec: z.string(),
});

export const FixTaskSchema = z.object({
    id: z.string(),
    branch: z.string(),
    root_cause: z.string(),
    fix_scope: z.enum(['TEST_CODE', 'LOCATOR_ADD']),
    confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
    fix_description: z.string(),
    diagnosis: z.string(),
    validations: z.array(TestToValidateSchema),
});

export const SkippedTaskSchema = z.object({
    root_cause: z.string(),
    reason: z.string(),
    affected_tests: z.array(z.string()),
});

export const ReportSchema = z.object({
    run_date: z.string(),
    web_run_id: z.string().nullable(),
    desktop_run_id: z.string().nullable(),
    fix_tasks: z.array(FixTaskSchema),
    skipped: z.array(SkippedTaskSchema),
});

export const FixResultSchema = z.object({
    task_id: z.string(),
    result: z.enum(['pass', 'partial', 'fail', 'not_duplicated']),
    passed: z.array(z.string()),
    failed: z.array(z.string()),
    iterations: z.number().int().nonnegative(),
    pr_title: z.string(),
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
    num_turns: z.number().optional(),
    usage: ClaudeUsageSchema.optional(),
    total_cost_usd: z.number().optional(),
    duration_ms: z.number().optional(),
});

export type FixTask = z.infer<typeof FixTaskSchema>;
export type SkippedTask = z.infer<typeof SkippedTaskSchema>;
export type Report = z.infer<typeof ReportSchema>;
export type FixResult = z.infer<typeof FixResultSchema>;
export type ClaudeResult = z.infer<typeof ClaudeResultSchema>;
