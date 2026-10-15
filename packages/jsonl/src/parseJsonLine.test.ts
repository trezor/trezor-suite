import { parseJsonLine } from './parseJsonLine';

describe(parseJsonLine.name, () => {
    it('parses a valid JSON object', () => {
        expect(parseJsonLine('{"key":"value"}', 1)).toEqual({
            success: true,
            payload: { key: 'value' },
        });
    });

    it('parses a JSON array', () => {
        expect(parseJsonLine('[1, 2, 3]', 1)).toEqual({
            success: true,
            payload: [1, 2, 3],
        });
    });

    it('parses a JSON primitive', () => {
        expect(parseJsonLine('"hello"', 1)).toEqual({
            success: true,
            payload: 'hello',
        });
    });

    it('returns an error for invalid JSON', () => {
        expect(parseJsonLine('not-json', 3)).toEqual({
            success: false,
            error: {
                type: 'JsonlInvalidJson',
                lineNumber: 3,
                message: expect.any(String),
            },
        });
    });

    it('includes the correct line number in the error', () => {
        const result = parseJsonLine('{broken', 42);

        expect(result.success).toBe(false);

        if (!result.success) {
            expect(result.error.lineNumber).toBe(42);
        }
    });
});
