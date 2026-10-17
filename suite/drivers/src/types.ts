import { type z } from 'zod';

/** A tool's input: one zod object; the MCP gets it as JSON Schema and validates calls against it. */
export type ToolInputSchema = z.ZodObject;

/**
 * One driver tool: its arguments are typed by its zod schema, so `execute` receives them parsed.
 * `toDiscoveredTool` turns it into what chrome-devtools-mcp reads from a `devtoolstooldiscovery`
 * answer.
 */
export type Tool<TInputSchema extends ToolInputSchema = ToolInputSchema> = {
    name: string;
    description: string;
    inputSchema: TInputSchema;
    execute: (args: z.output<TInputSchema>) => unknown;
};

/** The JSON Schema of a tool's input, as `z.toJSONSchema` renders it for the MCP's validator. */
export type ToolInputJsonSchema = z.core.JSONSchema.BaseSchema;

/**
 * One tool as chrome-devtools-mcp reads it from a `devtoolstooldiscovery` answer. The MCP validates
 * `execute` arguments against `inputSchema` and serializes the result: DOM elements become clickable
 * uids, functions and class instances print by their type.
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
