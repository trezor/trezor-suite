import { type z } from '@trezor/zod';

/**
 * A tool's input: one zod object, sent to the MCP as JSON Schema.
 */
export type ToolInputSchema = z.ZodObject;

/**
 * One tool; `execute` gets arguments already parsed by its zod schema.
 */
export type Tool<TInputSchema extends ToolInputSchema = ToolInputSchema> = {
    name: string;
    description: string;
    inputSchema: TInputSchema;
    execute: (args: z.output<TInputSchema>) => unknown;
};

/**
 * A tool's input as JSON Schema, rendered by `z.toJSONSchema`.
 */
export type ToolInputJsonSchema = z.core.JSONSchema.BaseSchema;

/**
 * One tool as chrome-devtools-mcp reads it.
 * The MCP serializes results:
 * DOM elements become clickable uids, functions and class instances print by type.
 */
export type DiscoveredTool = {
    name: string;
    description: string;
    inputSchema: ToolInputJsonSchema;
    execute: (args?: unknown) => unknown;
};

export type ToolGroup = {
    name: string;
    description: string;
    tools: DiscoveredTool[];
};
