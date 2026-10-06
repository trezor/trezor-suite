import type { Logger } from './logs';
import { stringifyLogArgs } from './stringifyLogArgs';

describe(stringifyLogArgs.name, () => {
    it('returns empty string for no arguments', () => {
        expect(stringifyLogArgs([])).toBe('');
    });

    it.each([
        ['null', null, 'null'],
        ['undefined', undefined, 'undefined'],
        ['string', 'hello', 'hello'],
        ['empty string', '', ''],
        ['integer', 42, '42'],
        ['negative float', -1.5, '-1.5'],
        ['zero', 0, '0'],
        ['NaN', NaN, 'NaN'],
        ['Infinity', Infinity, 'Infinity'],
        ['bigint', BigInt('9007199254740993'), '9007199254740993'],
        ['true', true, 'true'],
        ['false', false, 'false'],
        ['symbol', Symbol('sym'), 'Symbol(sym)'],
    ])('stringifies %s', (_name, arg, expected) => {
        expect(stringifyLogArgs([arg])).toBe(expected);
    });

    it('stringifies function via String()', () => {
        const fn = () => 1;

        expect(stringifyLogArgs([fn])).toBe(String(fn));
    });

    it('stringifies Error as its stack', () => {
        const error = new TypeError('foo-error');

        expect(stringifyLogArgs([error])).toBe(error.stack);
        expect(stringifyLogArgs([error])).toContain('TypeError: foo-error');
    });

    it('stringifies Error without stack as name and message', () => {
        const error = new TypeError('foo-error');
        delete error.stack;

        expect(stringifyLogArgs([error])).toBe('TypeError: foo-error');
    });

    it('stringifies nested Error as its stack', () => {
        const error = new Error('nested-error');

        expect(stringifyLogArgs([{ error }])).toBe(JSON.stringify({ error: error.stack }));
    });

    it('stringifies nested Error without stack as name and message', () => {
        const error = new Error('nested-error');
        delete error.stack;

        expect(stringifyLogArgs([{ error }])).toBe('{"error":"Error: nested-error"}');
    });

    it('stringifies Buffer as hex', () => {
        expect(stringifyLogArgs([Buffer.from([0x00, 0xab, 0xff])])).toBe('00abff');
    });

    it('stringifies Uint8Array as hex', () => {
        expect(stringifyLogArgs([new Uint8Array([1, 2, 254])])).toBe('0102fe');
    });

    it('stringifies other typed arrays by their bytes', () => {
        expect(stringifyLogArgs([new Uint16Array([0x0102])])).toBe(
            Buffer.from(new Uint16Array([0x0102]).buffer).toString('hex'),
        );
    });

    it('stringifies DataView as hex', () => {
        const view = new DataView(new Uint8Array([0xde, 0xad, 0xbe, 0xef]).buffer);

        expect(stringifyLogArgs([view])).toBe('deadbeef');
    });

    it('respects byteOffset and byteLength of typed array views', () => {
        const { buffer } = new Uint8Array([1, 2, 3, 4, 5, 6]);

        expect(stringifyLogArgs([new Uint8Array(buffer, 2, 3)])).toBe('030405');
        expect(stringifyLogArgs([new Uint8Array([1, 2, 3, 4]).subarray(1, 3)])).toBe('0203');
    });

    it('stringifies empty binary data as empty string', () => {
        expect(stringifyLogArgs([new Uint8Array(0)])).toBe('');
    });

    it('stringifies plain objects as JSON', () => {
        expect(stringifyLogArgs([{ a: 'x', b: true }])).toBe('{"a":"x","b":true}');
    });

    it('stringifies arrays as JSON', () => {
        expect(stringifyLogArgs([['a', true]])).toBe('["a",true]');
    });

    it('stringifies nested null and undefined as strings', () => {
        expect(stringifyLogArgs([{ a: null, b: undefined, list: [null, undefined] }])).toBe(
            '{"a":"null","b":"undefined","list":["null","undefined"]}',
        );
    });

    it('stringifies nested typed arrays as hex', () => {
        expect(stringifyLogArgs([{ bytes: new Uint8Array([1, 255]) }])).toBe('{"bytes":"01ff"}');
    });

    it('converts nested bigint and number values to strings', () => {
        expect(stringifyLogArgs([{ big: BigInt(10), n: 5, list: [BigInt(1), 2] }])).toBe(
            '{"big":"10","n":"5","list":["1","2"]}',
        );
    });

    it('stringifies nested functions via String()', () => {
        const fn = () => 1;

        expect(stringifyLogArgs([{ fn }])).toBe(JSON.stringify({ fn: String(fn) }));
    });

    it('omits nested symbol properties', () => {
        expect(stringifyLogArgs([{ a: Symbol('sym'), b: 'ok' }])).toBe('{"b":"ok"}');
    });

    it('stringifies Date as ISO string', () => {
        expect(stringifyLogArgs([new Date('2024-01-02T03:04:05.000Z')])).toBe(
            '"2024-01-02T03:04:05.000Z"',
        );
    });

    it('uses toJSON when available', () => {
        expect(stringifyLogArgs([{ toJSON: () => ({ custom: 'value' }) }])).toBe(
            '{"custom":"value"}',
        );
    });

    it('stringifies Map and Set as empty JSON objects', () => {
        expect(stringifyLogArgs([new Map([['a', 1]]), new Set([1])])).toBe('{}, {}');
    });

    it('falls back to String() for circular references', () => {
        const circular: Record<string, unknown> = { name: 'device' };
        circular.self = circular;

        expect(stringifyLogArgs([circular])).toBe('[object Object]');
    });

    it('falls back to String() for circular arrays', () => {
        const circular: unknown[] = [];
        circular.push(circular);

        expect(stringifyLogArgs([circular])).toBe('');
    });

    it('falls back to String() when JSON.stringify throws', () => {
        const throwing = {
            toJSON: () => {
                throw new Error('fail');
            },
            toString: () => 'custom string',
        };

        expect(stringifyLogArgs([throwing])).toBe('custom string');
    });

    it('joins multiple arguments of different types with comma and space', () => {
        expect(
            stringifyLogArgs(['msg', 1, null, undefined, { a: 1 }, Buffer.from([0xab]), true]),
        ).toBe('msg, 1, null, undefined, {"a":"1"}, ab, true');
    });

    it('stringifies arguments of Logger methods', () => {
        const args: Parameters<Logger['info']> = ['prefix', { id: 1 }, new Uint8Array([255])];

        expect(stringifyLogArgs(args)).toBe('prefix, {"id":"1"}, ff');
    });
});
