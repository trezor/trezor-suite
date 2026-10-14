import { z } from '@trezor/zod';

import { type DiscoveredTool, type Tool, type ToolInputSchema } from './types';

/**
 * Infers a tool's argument type from its schema.
 */
export const defineTool = <TInputSchema extends ToolInputSchema>(
    tool: Tool<TInputSchema>,
): Tool<TInputSchema> => tool;

/**
 * Parses call arguments (none means `{}`). Throws on a bad call, so the mistake is not hidden.
 */
export const parseToolArgs = <TInputSchema extends ToolInputSchema>(
    tool: Tool<TInputSchema>,
    args: unknown,
): z.output<TInputSchema> => {
    const result = tool.inputSchema.safeParse(args ?? {});
    if (!result.success) {
        throw new Error(`${tool.name}: ${z.prettifyError(result.error)}`);
    }

    return result.data;
};

/**
 * The tool as chrome-devtools-mcp reads it. Draft-07: the MCP's ajv knows no newer draft.
 */
export const toDiscoveredTool = <TInputSchema extends ToolInputSchema>(
    tool: Tool<TInputSchema>,
): DiscoveredTool => ({
    name: tool.name,
    description: tool.description,
    inputSchema: z.toJSONSchema(tool.inputSchema, { target: 'draft-07' }),
    execute: args => tool.execute(parseToolArgs(tool, args)),
});
