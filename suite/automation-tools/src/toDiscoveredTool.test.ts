import { z } from 'zod';

import { defineTool, parseToolArgs, toDiscoveredTool } from './toDiscoveredTool';

const echo = defineTool({
    name: 'test.echo',
    description: 'Repeats the text.',
    inputSchema: z.strictObject({
        text: z.string(),
        times: z.int().positive().optional().describe('Default 1.'),
    }),
    execute: ({ text, times = 1 }) => text.repeat(times),
});

describe(toDiscoveredTool.name, () => {
    it('renders the schema as a closed draft-07 object', () => {
        expect(toDiscoveredTool(echo).inputSchema).toEqual({
            $schema: 'http://json-schema.org/draft-07/schema#',
            type: 'object',
            properties: {
                text: { type: 'string' },
                times: {
                    type: 'integer',
                    exclusiveMinimum: 0,
                    maximum: Number.MAX_SAFE_INTEGER,
                    description: 'Default 1.',
                },
            },
            required: ['text'],
            additionalProperties: false,
        });
    });

    it('parses the arguments before the tool runs and treats a missing object as empty', () => {
        const tool = toDiscoveredTool(echo);

        expect(tool.execute({ text: 'ab', times: 2 })).toBe('abab');
        expect(tool.execute({ text: 'ab' })).toBe('ab');
        expect(() => tool.execute()).toThrow(/test\.echo: .*→ at text/s);
    });

    it('names the tool, the key and the problem of a malformed call', () => {
        expect(() => parseToolArgs(echo, { text: 1 })).toThrow(
            'test.echo: ✖ Invalid input: expected string, received number\n  → at text',
        );
        expect(() => parseToolArgs(echo, { text: 'a', extra: true })).toThrow(
            'test.echo: ✖ Unrecognized key: "extra"',
        );
        expect(() => parseToolArgs(echo, { text: 'a', times: 0 })).toThrow(/→ at times/);
    });
});
