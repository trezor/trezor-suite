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
    fix_scope: z.enum(['TEST_CODE', 'LOCATOR_ADD', 'PRODUCT_BUG', 'INFRA']),
    confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
    fix_description: z.string(),
    diagnosis: z.string(),
    validations: z.array(TestToValidateSchema),
});

export const ReportSchema = z.object({
    fix_tasks: z.array(FixTaskSchema),
});

export const FixResultSchema = z.object({
    task_id: z.string(),
    result: z.enum(['pass', 'partial', 'fail']),
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
export type Report = z.infer<typeof ReportSchema>;
export type FixResult = z.infer<typeof FixResultSchema>;
export type ClaudeResult = z.infer<typeof ClaudeResultSchema>;
