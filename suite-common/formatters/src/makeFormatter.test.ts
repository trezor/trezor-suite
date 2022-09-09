import { makeFormatter } from './makeFormatter';

const toUpperCase = (string: string) => string.toUpperCase();

const upperCaseFormatter = makeFormatter<string, string>(toUpperCase);

interface ValueRecord {
    value: string;
}

const valueRecordUpperCaseFormatter = makeFormatter<ValueRecord, ValueRecord, string>(
    ({ value }, suggestions) => {
        if (suggestions.includes('primitive')) {
            return toUpperCase(value);
        }

        return { value: toUpperCase(value) };
    },
);

describe('makeFormatter', () => {
    const format = jest.fn();

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('displayName', () => {
        it('accepts a `displayName` option', () => {
            const displayName = 'upperCaseFormatter';
            const formatter = makeFormatter<string, string>(toUpperCase, { displayName });
            expect(formatter.displayName).toBe(displayName);
        });
    });

    describe('format', () => {
        it('handles trivial formatting', () => {
            expect(upperCaseFormatter.format('foo')).toBe('FOO');
        });

        it('passes through non-empty suggestions', () => {
            const formatter = makeFormatter<string, string>(format);
            formatter.format('foo', ['abbreviated']);
            expect(format.mock.calls[0][1]).toEqual(['abbreviated']);
        });

        it('passes through empty suggestions', () => {
            const formatter = makeFormatter<string, string>(format);
            formatter.format('foo', []);
            expect(format.mock.calls[0][1]).toEqual([]);
        });

        it('defaults suggestions to an empty array', () => {
            const formatter = makeFormatter<string, string>(format);
            formatter.format('foo');
            expect(format.mock.calls[0][1]).toEqual([]);
        });

        it('passes through the `primitive` suggestion', () => {
            const formatter = makeFormatter<string, string>(format);
            formatter.format('foo', ['primitive']);
            expect(format.mock.calls[0][1]).toEqual(['primitive']);
        });

        it('passes the `primitive` suggestion alongside `comparable` when missing', () => {
            const formatter = makeFormatter<string, string>(format);
            formatter.format('foo', ['comparable']);
            expect(format.mock.calls[0][1]).toEqual(['primitive', 'comparable']);
        });

        it('does not pass the `primitive` suggestion alongside other suggestions when missing', () => {
            const formatter = makeFormatter<string, string>(format);
            formatter.format('foo', ['abbreviated', 'verbose']);
            expect(format.mock.calls[0][1]).toEqual(['abbreviated', 'verbose']);
        });

        it('supports data context', () => {
            const formatter = makeFormatter<string, string>(format);
            formatter.format('foo', [], { foo: 'bar' });
            expect(format.mock.calls[0][2]).toEqual({ foo: 'bar' });
        });

        it('defaults data context to an empty object', () => {
            const formatter = makeFormatter<string, string>(format);
            formatter.format('foo');
            expect(format.mock.calls[0][2]).toEqual({});
        });
    });

    describe('formatAsPrimitive', () => {
        it('handles trivial formatting', () => {
            expect(upperCaseFormatter.formatAsPrimitive('foo')).toBe('FOO');
        });

        it('passes the `primitive` suggestion when no suggestions are passed', () => {
            const formatter = makeFormatter<string, string>(format);
            formatter.formatAsPrimitive('foo');
            expect(format.mock.calls[0][1]).toEqual(['primitive']);
        });

        it('passes the `primitive` suggestion when empty suggestions are passed', () => {
            const formatter = makeFormatter<string, string>(format);
            formatter.formatAsPrimitive('foo', []);
            expect(format.mock.calls[0][1]).toEqual(['primitive']);
        });

        it('passes the `primitive` suggestion when a different suggestion is passed', () => {
            const formatter = makeFormatter<string, string>(format);
            formatter.formatAsPrimitive('foo', ['abbreviated']);
            expect(format.mock.calls[0][1]).toEqual(['primitive', 'abbreviated']);
        });

        it('passes through the `primitive` suggestion', () => {
            const formatter = makeFormatter<string, string>(format);
            formatter.formatAsPrimitive('foo', ['primitive']);
            expect(format.mock.calls[0][1]).toEqual(['primitive']);
        });

        it('passes the `primitive` suggestion alongside `comparable`', () => {
            const formatter = makeFormatter<string, string>(format);
            formatter.formatAsPrimitive('foo', ['comparable']);
            expect(format.mock.calls[0][1]).toEqual(['primitive', 'comparable']);
        });

        it('supports data context', () => {
            const formatter = makeFormatter<string, string>(format);
            formatter.formatAsPrimitive('foo', [], { foo: 'bar' });
            expect(format.mock.calls[0][2]).toEqual({ foo: 'bar' });
        });

        it('defaults data context to an empty object', () => {
            const formatter = makeFormatter<string, string>(format);
            formatter.formatAsPrimitive('foo');
            expect(format.mock.calls[0][2]).toEqual({});
        });
    });

    describe('wrap', () => {
        it('handles trivial wrapping', () => {
            const formatter = makeFormatter<string, string>(format).wrap(() => 'bar');
            expect(formatter.format('foo')).toBe('bar');
        });

        it('handles single-value mapping', () => {
            const formatter = makeFormatter<string, string>(format).wrap((delegate, value) =>
                value === 'ping' ? 'pong' : delegate(value),
            );

            expect(formatter.format('ping')).toBe('pong');
        });

        it('handles delegation to the original formatter', () => {
            const formatter = upperCaseFormatter.wrap((delegate, value) =>
                value === 'ping' ? 'pong' : delegate(value),
            );

            expect(formatter.format('foo')).toBe('FOO');
        });

        it('sets the `innerFormatter` property', () => {
            const wrappedFormatter = upperCaseFormatter.wrap((delegate, value) => delegate(value));
            expect(wrappedFormatter.innerFormatter).toBe(upperCaseFormatter);
        });

        it('passes the `primitive` suggestion to `delegate` when using `formatAsPrimitive`', () => {
            const formatter = valueRecordUpperCaseFormatter.wrap((delegate, value) =>
                delegate(value),
            );
            expect(formatter.formatAsPrimitive({ value: 'foo' })).toBe('FOO');
        });

        it('passes suggestions through to `delegate` when not overriden', () => {
            const formatter = valueRecordUpperCaseFormatter.wrap((delegate, value) =>
                delegate(value),
            );
            expect(formatter.format({ value: 'foo' }, ['primitive'])).toBe('FOO');
        });

        it('supports overriding of suggestions for `delegate`', () => {
            const formatter = valueRecordUpperCaseFormatter.wrap((delegate, value) =>
                delegate(value, []),
            );
            expect(formatter.format({ value: 'foo' }, ['primitive'])).toEqual({ value: 'FOO' });
        });

        it('supports modifying the input structure', () => {
            const formatter = upperCaseFormatter.wrap<ValueRecord>((delegate, { value }) =>
                delegate(value),
            );

            expect(formatter.format({ value: 'foo' })).toBe('FOO');
        });

        it('supports modifying the output structure', () => {
            const formatter = upperCaseFormatter.wrap<ValueRecord, ValueRecord>(
                (delegate, { value }) => ({ value: delegate(value) }),
            );

            expect(formatter.format({ value: 'foo' })).toEqual({ value: 'FOO' });
        });

        it('supports modifying the data context structure', () => {
            interface ListContext {
                row: string;
            }

            const listFormatter = upperCaseFormatter.wrap<string, string, string, ListContext>(
                (delegate, value, _suggestions, { row }) => `${row}: ${delegate(value)}`,
            );

            interface GridContext extends ListContext {
                column: string;
            }

            expect(listFormatter.format('foo', [], { row: 'A' })).toBe('A: FOO');

            const gridFormatter = listFormatter.wrap<string, string, string, GridContext>(
                (delegate, value, _suggestions, { column }) =>
                    delegate(value).replace(':', `${column}:`),
            );

            expect(gridFormatter.format('foo', [], { row: 'B', column: '1' })).toBe('B1: FOO');
        });
    });
});
