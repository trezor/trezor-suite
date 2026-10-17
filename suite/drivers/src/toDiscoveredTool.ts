import { z } from 'zod';

import { type DiscoveredTool, type Tool, type ToolInputSchema } from './types';

/** Keeps a tool's argument type inferred from its schema where the tool is written. */
export const defineTool = <TInputSchema extends ToolInputSchema>(
    tool: Tool<TInputSchema>,
): Tool<TInputSchema> => tool;

/**
 * Parses a call's arguments with the tool's schema; a missing object counts as an empty one. A
 * malformed call throws, naming the tool, the key and the problem: the MCP reports the message to
 * the agent and the perf rig's synchronous helpers read undefined. A silent fallback would hide
 * the mistake instead.
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
 * The tool as chrome-devtools-mcp reads it: the zod schema rendered as draft-07 JSON Schema, which
 * the MCP's ajv instance validates calls against (its default instance knows no newer draft), and
 * an `execute` that parses what it is given before the tool runs.
 */
export const toDiscoveredTool = <TInputSchema extends ToolInputSchema>(
    tool: Tool<TInputSchema>,
): DiscoveredTool => ({
    name: tool.name,
    description: tool.description,
    inputSchema: z.toJSONSchema(tool.inputSchema, { target: 'draft-07' }),
    execute: args => tool.execute(parseToolArgs(tool, args)),
});
