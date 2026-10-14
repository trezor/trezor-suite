export type JsonSchema = {
    /** Omitted for a value of any type. */
    type?: 'object' | 'string' | 'number' | 'integer' | 'boolean' | 'array';
    description?: string;
    properties?: Record<string, JsonSchema>;
    required?: string[];
    additionalProperties?: boolean;
    enum?: string[];
    items?: JsonSchema;
};

export type ToolInputSchema = JsonSchema & { type: 'object'; additionalProperties: false };

export type ToolArgs = Record<string, unknown>;

/**
 * One tool as chrome-devtools-mcp (1.3.0) reads it from a `devtoolstooldiscovery` answer. The MCP
 * validates `execute` arguments against `inputSchema` and serializes the result: DOM elements
 * become clickable uids, functions and class instances print by their type.
 */
export type Tool = {
    name: string;
    description: string;
    inputSchema: ToolInputSchema;
    execute: (args: ToolArgs) => unknown;
};

export type ToolGroup = {
    name: string;
    description: string;
    tools: Tool[];
};
