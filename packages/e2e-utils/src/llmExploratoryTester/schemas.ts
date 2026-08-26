import { z } from 'zod';

// Strip the top-level `$schema` which breaks Agent's attempt of JSON output.
const toCliJsonSchema = (schema: z.ZodType) => {
    const jsonSchema = z.toJSONSchema(schema);
    delete jsonSchema.$schema;

    return jsonSchema;
};

export const DEVICE_MODELS = ['T1B1', 'T2T1', 'T3B1', 'T3T1', 'T3W1'] as const;

export const DeviceModelSchema = z.enum(DEVICE_MODELS);

// Harness fields (urls/model) plus the slim brief the QA agent sees.
export const PrContextSchema = z.object({
    prNumber: z.number().int().positive(),
    prUrl: z.string(),
    prTitle: z.string(),
    prBody: z.string(),
    // Closing issue from the PR's closingIssuesReferences, when present.
    issue: z
        .object({
            number: z.number().int().positive(),
            title: z.string(),
            body: z.string(),
            url: z.string(),
        })
        .nullable(),
    deviceModel: DeviceModelSchema,
    suiteUrl: z.string(),
});

export const ScreenshotBasenameSchema = z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*\.png$/, 'expected a kebab-case PNG basename');

export const IssueSchema = z.object({
    id: z.string(),
    severity: z.enum(['critical', 'high', 'medium', 'low', 'info']),
    title: z.string(),
    description: z.string(),
    reproSteps: z.array(z.string()),
    screenshots: z.array(ScreenshotBasenameSchema).min(1),
});

export const TestResultSchema = z.object({
    result: z.enum(['pass', 'partial', 'fail', 'blocked']),
    summary: z.string(),
    issues: z.array(IssueSchema),
});

export const ClaudeResultSchema = z.object({
    type: z.string().optional(),
    subtype: z.string().optional(),
    result: z.string().optional(),
    structured_output: z.unknown().optional(),
});

export type DeviceModel = z.infer<typeof DeviceModelSchema>;
export type PrContext = z.infer<typeof PrContextSchema>;
export type Issue = z.infer<typeof IssueSchema>;
export type TestResult = z.infer<typeof TestResultSchema>;
export type ClaudeResult = z.infer<typeof ClaudeResultSchema>;

export const TestResultJsonSchema = toCliJsonSchema(TestResultSchema);
