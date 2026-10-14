import { type ToolArgs } from './types';

// Tools throw on a malformed call: the MCP reports the message to the agent and the perf rig's
// synchronous helpers read undefined. A silent fallback would hide the mistake instead.
const invalidArgument = (tool: string, key: string, expected: string) =>
    new Error(`${tool}: "${key}" must be ${expected}`);

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

export const readRequiredString = (args: ToolArgs, key: string, tool: string): string => {
    const value = args[key];
    if (typeof value !== 'string') {
        throw invalidArgument(tool, key, 'a string');
    }

    return value;
};

export const readOptionalString = (
    args: ToolArgs,
    key: string,
    tool: string,
): string | undefined =>
    args[key] === undefined ? undefined : readRequiredString(args, key, tool);

export const readOptionalNumber = (
    args: ToolArgs,
    key: string,
    tool: string,
): number | undefined => {
    const value = args[key];
    if (value === undefined) {
        return undefined;
    }
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw invalidArgument(tool, key, 'a finite number');
    }

    return value;
};

export const readOptionalBoolean = (
    args: ToolArgs,
    key: string,
    tool: string,
): boolean | undefined => {
    const value = args[key];
    if (value === undefined) {
        return undefined;
    }
    if (typeof value !== 'boolean') {
        throw invalidArgument(tool, key, 'a boolean');
    }

    return value;
};

export const readRequiredObject = (
    args: ToolArgs,
    key: string,
    tool: string,
): Record<string, unknown> => {
    const value = args[key];
    if (!isRecord(value)) {
        throw invalidArgument(tool, key, 'an object');
    }

    return value;
};

export const readOptionalObject = (
    args: ToolArgs,
    key: string,
    tool: string,
): Record<string, unknown> | undefined =>
    args[key] === undefined ? undefined : readRequiredObject(args, key, tool);
