// Python 3.13 standard-library compatibility helpers for the feature-map scripts.
// Each helper reproduces the exact output of the Python behaviour named in its comment,
// so the TypeScript ports produce byte-identical files.

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as nodePath from 'node:path';

export const FEATURE_MAP_DIR: string = import.meta.dirname;
export const REPO_ROOT: string = nodePath.dirname(
    nodePath.dirname(nodePath.dirname(FEATURE_MAP_DIR)),
);

// ---------------------------------------------------------------------------
// JSON value model
// ---------------------------------------------------------------------------

/** A Python float. JSON numbers with a fraction or exponent parse to this, so 1.0 stays "1.0". */
export class PyFloat {
    readonly value: number;

    constructor(value: number) {
        this.value = value;
    }
}

/** Python-visible key order for objects whose JS property order would differ (integer-like keys). */
export const KEY_ORDER: unique symbol = Symbol('pyKeyOrder');

export type Json = null | boolean | number | bigint | string | PyFloat | Json[] | JsonObject;
export interface JsonObject {
    [key: string]: Json;
    [KEY_ORDER]?: readonly string[];
}

const INTEGER_KEY = /^(?:0|[1-9]\d*)$/;

const isIntegerLike = (key: string) => INTEGER_KEY.test(key) && Number(key) < 4294967295;

export const isPlainObject = (value: unknown): value is JsonObject => {
    if (value === null || typeof value !== 'object') return false;
    const proto = Object.getPrototypeOf(value);

    return proto === Object.prototype || proto === null;
};

const defineOwn = (target: JsonObject, key: string, value: Json) => {
    if (key === '__proto__') {
        Object.defineProperty(target, key, {
            value,
            writable: true,
            enumerable: true,
            configurable: true,
        });
    } else {
        target[key] = value;
    }
};

const attachOrder = (target: JsonObject, order: string[]) => {
    const jsOrder = Object.keys(target);
    if (jsOrder.length === order.length && jsOrder.every((key, index) => key === order[index]))
        return;
    // Enumerable so that object spread / Object.assign carry it like Python {**d} keeps key order.
    Object.defineProperty(target, KEY_ORDER, {
        value: order,
        enumerable: true,
        writable: true,
        configurable: true,
    });
};

/** dict keys in Python insertion order (JS reorders integer-like keys first). */
export const pyKeys = (obj: object): string[] => {
    const own = Object.keys(obj);
    const order = (obj as JsonObject)[KEY_ORDER];
    if (!order) return own;
    const ownSet = new Set(own);
    const result = order.filter(key => ownSet.has(key));
    const seen = new Set(result);
    for (const key of own) if (!seen.has(key)) result.push(key);

    return result;
};

/** dict.items() in Python order. */
export const pyEntries = <T extends Json>(obj: { [key: string]: T }): [string, T][] =>
    pyKeys(obj).map(key => [key, obj[key]] as [string, T]);

/** dict(pairs): later duplicates overwrite the value but keep the first position. */
export const pyDict = (entries: Iterable<readonly [string, Json]>): JsonObject => {
    const result: JsonObject = {};
    const order: string[] = [];
    let needsOrder = false;
    for (const [key, value] of entries) {
        if (!Object.hasOwn(result, key)) {
            order.push(key);
            if (isIntegerLike(key)) needsOrder = true;
        }
        defineOwn(result, key, value);
    }
    if (needsOrder) attachOrder(result, order);

    return result;
};

/** d[key] = value that keeps Python insertion order even for integer-like keys. */
export const pySetKey = (obj: JsonObject, key: string, value: Json): void => {
    const existed = Object.hasOwn(obj, key);
    if (!existed && (obj[KEY_ORDER] || isIntegerLike(key))) {
        const order = [...pyKeys(obj), key];
        defineOwn(obj, key, value);
        attachOrder(obj, order);

        return;
    }
    defineOwn(obj, key, value);
};

/** Own-property membership (`key in dict`); never consults the prototype chain. */
export const hasKey = (obj: object, key: string): boolean => Object.hasOwn(obj, key);

// ---------------------------------------------------------------------------
// json.loads
// ---------------------------------------------------------------------------

export class PyJsonDecodeError extends Error {
    constructor(message: string, text: string, position: number) {
        const before = text.slice(0, position);
        const line = before.split('\n').length;
        const column = position - before.lastIndexOf('\n');
        super(`${message}: line ${line} column ${column} (char ${position})`);
        this.name = 'JSONDecodeError';
    }
}

/**
 * json.loads(text): object key order (including integer-like keys) is preserved via KEY_ORDER,
 * floats become PyFloat, integers beyond 2**53 become bigint, NaN/Infinity/-Infinity are accepted.
 */
export const pyJsonLoads = (text: string): Json => {
    let pos = 0;
    const { length } = text;
    const fail = (message: string, at = pos): never => {
        throw new PyJsonDecodeError(message, text, at);
    };
    const skipWhitespace = () => {
        while (pos < length) {
            const c = text.charCodeAt(pos);
            if (c === 0x20 || c === 0x09 || c === 0x0a || c === 0x0d) pos++;
            else break;
        }
    };
    const parseString = (): string => {
        // pos is at the opening quote
        const start = pos + 1;
        let i = start;
        let simple = true;
        while (i < length) {
            const c = text.charCodeAt(i);
            if (c === 0x22) break;
            if (c === 0x5c) {
                simple = false;
                i += 2;
                continue;
            }
            if (c < 0x20) fail('Invalid control character at', i);
            i++;
        }
        if (i >= length) fail('Unterminated string starting at', pos);
        const raw = text.slice(start, i);
        pos = i + 1;
        if (simple) return raw;
        // Python rejects invalid escapes and short \u escapes like JSON.parse does.
        try {
            return JSON.parse('"' + raw + '"') as string;
        } catch {
            return fail('Invalid \\escape', start);
        }
    };
    const NUMBER = /-?(?:0|[1-9]\d*)(\.\d+)?([eE][-+]?\d+)?/y;
    const parseValue = (): Json => {
        skipWhitespace();
        if (pos >= length) fail('Expecting value');
        const c = text[pos];
        if (c === '"') return parseString();
        if (c === '{') {
            pos++;
            const obj: JsonObject = {};
            const order: string[] = [];
            let needsOrder = false;
            skipWhitespace();
            if (text[pos] === '}') {
                pos++;

                return obj;
            }
            for (;;) {
                skipWhitespace();
                if (text[pos] !== '"') fail('Expecting property name enclosed in double quotes');
                const key = parseString();
                skipWhitespace();
                if (text[pos] !== ':') fail("Expecting ':' delimiter");
                pos++;
                const value = parseValue();
                if (!Object.hasOwn(obj, key)) {
                    order.push(key);
                    if (isIntegerLike(key)) needsOrder = true;
                }
                defineOwn(obj, key, value);
                skipWhitespace();
                if (text[pos] === ',') {
                    pos++;
                    continue;
                }
                if (text[pos] === '}') {
                    pos++;
                    break;
                }
                fail("Expecting ',' delimiter");
            }
            if (needsOrder) attachOrder(obj, order);

            return obj;
        }
        if (c === '[') {
            pos++;
            const list: Json[] = [];
            skipWhitespace();
            if (text[pos] === ']') {
                pos++;

                return list;
            }
            for (;;) {
                list.push(parseValue());
                skipWhitespace();
                if (text[pos] === ',') {
                    pos++;
                    continue;
                }
                if (text[pos] === ']') {
                    pos++;
                    break;
                }
                fail("Expecting ',' delimiter");
            }

            return list;
        }
        if (text.startsWith('null', pos)) {
            pos += 4;

            return null;
        }
        if (text.startsWith('true', pos)) {
            pos += 4;

            return true;
        }
        if (text.startsWith('false', pos)) {
            pos += 5;

            return false;
        }
        if (text.startsWith('NaN', pos)) {
            pos += 3;

            return new PyFloat(NaN);
        }
        if (text.startsWith('Infinity', pos)) {
            pos += 8;

            return new PyFloat(Infinity);
        }
        if (text.startsWith('-Infinity', pos)) {
            pos += 9;

            return new PyFloat(-Infinity);
        }
        NUMBER.lastIndex = pos;
        const match = NUMBER.exec(text);
        if (!match) return fail('Expecting value');
        pos += match[0].length;
        if (match[1] !== undefined || match[2] !== undefined) return new PyFloat(Number(match[0]));
        const asNumber = Number(match[0]);
        if (Number.isSafeInteger(asNumber)) return asNumber === 0 ? 0 : asNumber;

        return BigInt(match[0]);
    };
    const value = parseValue();
    skipWhitespace();
    if (pos !== length) fail('Extra data');

    return value;
};

// ---------------------------------------------------------------------------
// json.dumps
// ---------------------------------------------------------------------------

export type JsonDumpsOptions = {
    indent?: number | string | null;
    sortKeys?: boolean;
    ensureAscii?: boolean;
    separators?: readonly [string, string];
};

const ESCAPES: Record<string, string> = {
    '"': '\\"',
    '\\': '\\\\',
    '\n': '\\n',
    '\r': '\\r',
    '\t': '\\t',
    '\b': '\\b',
    '\f': '\\f',
};
const escapeUnit = (unit: string): string =>
    ESCAPES[unit] ?? '\\u' + unit.charCodeAt(0).toString(16).padStart(4, '0');
// json.encoder.ESCAPE and ESCAPE_ASCII, matched per UTF-16 unit so astral characters become surrogate pairs.
// eslint-disable-next-line no-control-regex -- JSON must escape the C0 control characters, as Python does.
const ESCAPE_UNICODE = /[\x00-\x1f"\\]/g;
const ESCAPE_ASCII = /[^\x20-\x7e]|["\\]/g;

/** encode_basestring / encode_basestring_ascii */
export const pyJsonString = (value: string, ensureAscii = true): string =>
    '"' + value.replace(ensureAscii ? ESCAPE_ASCII : ESCAPE_UNICODE, escapeUnit) + '"';

/** float.__repr__ (shortest round-trip, Python exponent rules). */
export const pyFloatRepr = (value: number): string => {
    if (Number.isNaN(value)) return 'nan';
    if (value === Infinity) return 'inf';
    if (value === -Infinity) return '-inf';
    if (value === 0) return Object.is(value, -0) ? '-0.0' : '0.0';
    const sign = value < 0 ? '-' : '';
    const [mantissa, exponentText] = Math.abs(value).toExponential().split('e');
    const digits = mantissa.replace('.', '');
    const exponent = Number(exponentText);
    const decpt = exponent + 1;
    if (decpt > 16 || decpt <= -4) {
        const absExponent = Math.abs(exponent);

        return (
            sign +
            digits[0] +
            (digits.length > 1 ? '.' + digits.slice(1) : '') +
            'e' +
            (exponent < 0 ? '-' : '+') +
            (absExponent < 10 ? '0' : '') +
            absExponent
        );
    }
    if (decpt <= 0) return sign + '0.' + '0'.repeat(-decpt) + digits;
    if (decpt >= digits.length) return sign + digits + '0'.repeat(decpt - digits.length) + '.0';

    return sign + digits.slice(0, decpt) + '.' + digits.slice(decpt);
};

const jsonFloat = (value: number): string => {
    if (Number.isNaN(value)) return 'NaN';
    if (value === Infinity) return 'Infinity';
    if (value === -Infinity) return '-Infinity';

    return pyFloatRepr(value);
};

/** int.__repr__ for a JS number: integral numbers are ints, anything else is treated as a Python float. */
const numberRepr = (value: number): string => {
    if (Number.isInteger(value)) return Object.is(value, -0) ? '0' : String(BigInt(value));

    return jsonFloat(value);
};

const typeName = (value: unknown): string => {
    if (value === undefined) return 'undefined';
    if (typeof value === 'object' && value !== null) return value.constructor?.name ?? 'object';

    return typeof value;
};

const jsonKey = (key: unknown): string => {
    if (typeof key === 'string') return key;
    if (key === null) return 'null';
    if (key === true) return 'true';
    if (key === false) return 'false';
    if (typeof key === 'number') return numberRepr(key);
    if (typeof key === 'bigint') return key.toString();
    if (key instanceof PyFloat) return jsonFloat(key.value);
    throw new TypeError(`keys must be str, int, float, bool or None, not ${typeName(key)}`);
};

/** str < str in Python: code point order, lone surrogates included (JS < compares UTF-16 units). */
export const pyCompareStrings = (a: string, b: string): number => {
    if (a === b) return 0;
    const n = Math.min(a.length, b.length);
    let i = 0;
    while (i < n && a.charCodeAt(i) === b.charCodeAt(i)) i++;
    if (i === n) {
        if (a.length < b.length) return -1;

        return a.length > b.length ? 1 : 0;
    }
    // A shared high surrogate just before the difference may pair with either following unit.
    const previous = i > 0 ? a.charCodeAt(i - 1) : 0;
    if (previous >= 0xd800 && previous <= 0xdbff) {
        const x = a.codePointAt(i - 1) as number;
        const y = b.codePointAt(i - 1) as number;
        if (x !== y) return x < y ? -1 : 1;
    }
    const x = a.codePointAt(i) as number;
    const y = b.codePointAt(i) as number;

    return x < y ? -1 : 1;
};

/** json.dumps(value, indent=..., sort_keys=..., ensure_ascii=..., separators=...) */
export const pyJsonDumps = (value: unknown, options: JsonDumpsOptions = {}): string => {
    const ensureAscii = options.ensureAscii ?? true;
    let indent: string | null = null;
    if (typeof options.indent === 'number') indent = ' '.repeat(options.indent);
    else if (options.indent !== undefined && options.indent !== null) indent = options.indent;
    const [itemSeparator, keySeparator] =
        options.separators ?? (indent === null ? [', ', ': '] : [',', ': ']);
    const sortKeys = options.sortKeys ?? false;
    const active = new Set<object>();
    const out: string[] = [];

    const enter = (container: object) => {
        if (active.has(container)) throw new Error('Circular reference detected');
        active.add(container);
    };
    const encode = (item: unknown, level: number): void => {
        if (item === null) {
            out.push('null');
        } else if (item === true) {
            out.push('true');
        } else if (item === false) {
            out.push('false');
        } else if (typeof item === 'string') {
            out.push(pyJsonString(item, ensureAscii));
        } else if (typeof item === 'number') {
            out.push(numberRepr(item));
        } else if (typeof item === 'bigint') {
            out.push(item.toString());
        } else if (item instanceof PyFloat) {
            out.push(jsonFloat(item.value));
        } else if (Array.isArray(item)) {
            if (item.length === 0) {
                out.push('[]');

                return;
            }
            enter(item);
            const newline = indent === null ? '' : '\n' + indent.repeat(level + 1);
            out.push('[' + newline);
            item.forEach((element, index) => {
                if (index) out.push(itemSeparator + newline);
                encode(element, level + 1);
            });
            if (indent !== null) out.push('\n' + indent.repeat(level));
            out.push(']');
            active.delete(item);
        } else if (item instanceof Map || isPlainObject(item)) {
            let entries: [string, unknown][];
            if (item instanceof Map) {
                entries = [...item.entries()].map(([key, entryValue]) => [
                    jsonKey(key),
                    entryValue,
                ]);
            } else {
                entries = pyKeys(item).map(key => [key, item[key]]);
            }
            if (entries.length === 0) {
                out.push('{}');

                return;
            }
            if (sortKeys) entries.sort((a, b) => pyCompareStrings(a[0], b[0]));
            enter(item);
            const newline = indent === null ? '' : '\n' + indent.repeat(level + 1);
            out.push('{' + newline);
            entries.forEach(([key, entryValue], index) => {
                if (index) out.push(itemSeparator + newline);
                out.push(pyJsonString(key, ensureAscii) + keySeparator);
                encode(entryValue, level + 1);
            });
            if (indent !== null) out.push('\n' + indent.repeat(level));
            out.push('}');
            active.delete(item);
        } else {
            throw new TypeError(`Object of type ${typeName(item)} is not JSON serializable`);
        }
    };
    encode(value, 0);

    return out.join('');
};

// ---------------------------------------------------------------------------
// hashlib
// ---------------------------------------------------------------------------

const LONE_SURROGATE = /[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/;

/** str.encode() (UTF-8, strict: lone surrogates raise). */
export const pyEncode = (text: string): Buffer => {
    const lone = text.search(LONE_SURROGATE);
    if (lone >= 0) {
        throw new Error(
            `UnicodeEncodeError: 'utf-8' codec can't encode character '\\u${text.charCodeAt(lone).toString(16)}' in position ${lone}: surrogates not allowed`,
        );
    }

    return Buffer.from(text, 'utf8');
};

/** hashlib.sha256(data).hexdigest(); strings are encoded as UTF-8 first. */
export const sha256Hex = (data: string | Uint8Array): string =>
    createHash('sha256')
        .update(typeof data === 'string' ? pyEncode(data) : data)
        .digest('hex');

/** hashlib.sha256(Path(path).read_bytes()).hexdigest() */
export const sha256File = (path: string): string => sha256Hex(fs.readFileSync(path));

/** hashlib.sha256(json.dumps(value, sort_keys=True).encode()).hexdigest() (coverage.digest, baseline hashes). */
export const pyDigest = (value: unknown): string =>
    sha256Hex(pyJsonDumps(value, { sortKeys: true }));

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------

/** build.unique: list({json.dumps(item, sort_keys=True): item for item in items}.values()) — first position, last value. */
export const unique = <T>(items: Iterable<T>): T[] => {
    const byKey = new Map<string, T>();
    for (const item of items) byKey.set(pyJsonDumps(item, { sortKeys: true }), item);

    return [...byKey.values()];
};

export type PyKey = string | number | boolean | null;

/** collections.Counter(items) as an insertion-ordered Map (dict(Counter(...)) order). */
export const pyCounter = <K extends PyKey>(items: Iterable<K>): Map<K, number> => {
    const counts = new Map<K, number>();
    for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1);

    return counts;
};

/** Counter.most_common(n): count descending, ties keep insertion order. */
export const pyMostCommon = <K>(counter: Map<K, number>, n?: number): [K, number][] => {
    const sorted = [...counter.entries()].sort((a, b) => b[1] - a[1]);

    return n === undefined ? sorted : sorted.slice(0, Math.max(0, n));
};

const numeric = (value: unknown): number | bigint | undefined => {
    if (typeof value === 'number' || typeof value === 'bigint') return value;
    if (typeof value === 'boolean') return value ? 1 : 0;
    if (value instanceof PyFloat) return value.value;

    return undefined;
};

/** DictReader restkey (None): surplus values of a long row; pyEquals treats it as an extra dict key. */
export const CSV_REST_KEY: unique symbol = Symbol('csvRestKey');

/** Python == for JSON-like values (1 == 1.0 == True, dict equality ignores key order). */
export const pyEquals = (a: unknown, b: unknown): boolean => {
    if (a === b) return typeof a !== 'number' || !Number.isNaN(a);
    const x = numeric(a);
    const y = numeric(b);
    if (x !== undefined || y !== undefined) {
        if (x === undefined || y === undefined) return false;

        return typeof x === typeof y ? x === y : Number(x) === Number(y);
    }
    if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
    if (Array.isArray(a) || Array.isArray(b)) {
        if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;

        return a.every((item, index) => pyEquals(item, b[index]));
    }
    if (a instanceof Set || b instanceof Set) {
        if (!(a instanceof Set) || !(b instanceof Set) || a.size !== b.size) return false;
        for (const item of a) if (!b.has(item)) return false;

        return true;
    }
    const entriesOf = (value: object): Map<string, unknown> | undefined => {
        if (value instanceof Map)
            return new Map([...value.entries()].map(([k, v]) => [jsonKey(k), v]));
        if (isPlainObject(value)) return new Map(Object.keys(value).map(k => [k, value[k]]));

        return undefined;
    };
    const left = entriesOf(a);
    const right = entriesOf(b);
    if (!left || !right || left.size !== right.size) return false;
    const restA = (a as { [CSV_REST_KEY]?: unknown })[CSV_REST_KEY];
    const restB = (b as { [CSV_REST_KEY]?: unknown })[CSV_REST_KEY];
    if ((restA === undefined) !== (restB === undefined) || !pyEquals(restA ?? null, restB ?? null))
        return false;
    for (const [key, value] of left) {
        if (!right.has(key) || !pyEquals(value, right.get(key))) return false;
    }

    return true;
};

/** Python ordering (<) for str, int/float/bool and tuples (arrays); other mixes raise TypeError. */
export const pyCompare = (a: unknown, b: unknown): number => {
    if (typeof a === 'string' && typeof b === 'string') return pyCompareStrings(a, b);
    const x = numeric(a);
    const y = numeric(b);
    if (x !== undefined && y !== undefined) {
        if (x < y) return -1;

        return x > y ? 1 : 0;
    }
    if (Array.isArray(a) && Array.isArray(b)) {
        const n = Math.min(a.length, b.length);
        for (let i = 0; i < n; i++) {
            if (pyEquals(a[i], b[i])) continue;

            return pyCompare(a[i], b[i]);
        }

        if (a.length - b.length < 0) return -1;

        return a.length > b.length ? 1 : 0;
    }
    throw new TypeError(
        `'<' not supported between instances of '${typeName(a)}' and '${typeName(b)}'`,
    );
};

/** sorted(items, key=..., reverse=...): stable; reverse keeps equal items in original order. */
export const pySorted = <T>(
    items: Iterable<T>,
    key?: (item: T) => unknown,
    reverse = false,
): T[] => {
    const decorated = [...items].map(item => ({ item, sortKey: key ? key(item) : item }));
    decorated.sort((a, b) => (reverse ? -1 : 1) * pyCompare(a.sortKey, b.sortKey) || 0);

    return decorated.map(entry => entry.item);
};

/** copy.deepcopy for JSON-like data: shared references inside the copied value stay shared. */
export const pyDeepCopy = <T>(value: T, memo: Map<object, unknown> = new Map()): T => {
    if (value === null || typeof value !== 'object' || value instanceof PyFloat) return value;
    if (memo.has(value)) return memo.get(value) as T;
    if (Array.isArray(value)) {
        const copy: unknown[] = [];
        memo.set(value, copy);
        for (const item of value) copy.push(pyDeepCopy(item, memo));

        return copy as T;
    }
    if (value instanceof Map) {
        const copy = new Map();
        memo.set(value, copy);
        for (const [key, item] of value) copy.set(pyDeepCopy(key, memo), pyDeepCopy(item, memo));

        return copy as T;
    }
    if (value instanceof Set) {
        const copy = new Set();
        memo.set(value, copy);
        for (const item of value) copy.add(pyDeepCopy(item, memo));

        return copy as T;
    }
    if (isPlainObject(value)) {
        const copy: JsonObject = {};
        memo.set(value, copy);
        for (const key of Object.keys(value)) defineOwn(copy, key, pyDeepCopy(value[key], memo));
        const order = value[KEY_ORDER];
        if (order) attachOrder(copy, [...order]);

        return copy as T;
    }
    throw new TypeError(`Cannot deep-copy ${typeName(value)}`);
};

// ---------------------------------------------------------------------------
// str helpers
// ---------------------------------------------------------------------------

// str.isspace() characters (Python 3.13 / Unicode 15.1).
const PY_SPACE_CLASS =
    ' \\t\\n\\r\\f\\v\\x1c-\\x1f\\x85\\xa0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000';
const PY_SPACE = new RegExp(`[${PY_SPACE_CLASS}]`);
const LEADING_SPACE = new RegExp(`^[${PY_SPACE_CLASS}]+`);
const TRAILING_SPACE = new RegExp(`[${PY_SPACE_CLASS}]+$`);
const SPACE_RUNS = new RegExp(`[${PY_SPACE_CLASS}]+`);

export const pyIsSpace = (char: string): boolean =>
    char.length > 0 && [...char].every(c => PY_SPACE.test(c));

const stripChars = (text: string, chars: string, left: boolean, right: boolean): string => {
    const set = new Set(chars);
    const points = [...text];
    let start = 0;
    let end = points.length;
    if (left) while (start < end && set.has(points[start])) start++;
    if (right) while (end > start && set.has(points[end - 1])) end--;

    return points.slice(start, end).join('');
};

/** str.strip(chars=None) */
export const pyStrip = (text: string, chars?: string): string =>
    chars === undefined
        ? text.replace(LEADING_SPACE, '').replace(TRAILING_SPACE, '')
        : stripChars(text, chars, true, true);

/** str.lstrip(chars=None) */
export const pyLstrip = (text: string, chars?: string): string =>
    chars === undefined ? text.replace(LEADING_SPACE, '') : stripChars(text, chars, true, false);

/** str.rstrip(chars=None) */
export const pyRstrip = (text: string, chars?: string): string =>
    chars === undefined ? text.replace(TRAILING_SPACE, '') : stripChars(text, chars, false, true);

/** str.split() with no separator: split on whitespace runs, drop empty edges. */
export const pySplitWhitespace = (text: string): string[] => {
    const stripped = pyStrip(text);

    return stripped ? stripped.split(SPACE_RUNS) : [];
};

/** str.splitlines(): \n, \r, \r\n, \v, \f, \x1c-\x1e, \x85, \u2028, \u2029; no trailing empty line. */
export const splitlines = (text: string, keepends = false): string[] => {
    const lines: string[] = [];
    // eslint-disable-next-line no-control-regex -- Python's splitlines() treats \x1c-\x1e as line breaks.
    const breaks = /\r\n|[\n\r\v\f\x1c\x1d\x1e\x85\u2028\u2029]/g;
    let start = 0;
    let match: RegExpExecArray | null;
    while ((match = breaks.exec(text)) !== null) {
        const end = match.index + match[0].length;
        lines.push(text.slice(start, keepends ? end : match.index));
        start = end;
    }
    if (start < text.length) lines.push(text.slice(start));

    return lines;
};

/** str.count(sub, start, end) for a non-empty sub; indices are JS string indices. */
export const pyCount = (text: string, sub: string, start = 0, end = text.length): number => {
    let count = 0;
    let index = text.indexOf(sub, start);
    while (index >= 0 && index + sub.length <= end) {
        count++;
        index = text.indexOf(sub, index + sub.length);
    }

    return count;
};

/** html.escape(text, quote=True) */
export const pyHtmlEscape = (text: string, quote = true): string => {
    let result = text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    if (quote) result = result.replaceAll('"', '&quot;').replaceAll("'", '&#x27;');

    return result;
};

// ---------------------------------------------------------------------------
// repr / str / assert / exit
// ---------------------------------------------------------------------------

/** Marks a value that should render with a fixed repr, e.g. a pathlib.Path in an assertion message. */
export class PyReprValue {
    readonly repr: string;
    readonly str: string;

    constructor(repr: string, str: string) {
        this.repr = repr;
        this.str = str;
    }
}

const NON_PRINTABLE = /[\p{Cc}\p{Cf}\p{Cs}\p{Co}\p{Cn}\p{Zl}\p{Zp}\p{Zs}]/u;

const stringRepr = (text: string): string => {
    const quote = text.includes("'") && !text.includes('"') ? '"' : "'";
    let out = quote;
    for (const char of text) {
        const cp = char.codePointAt(0) as number;
        if (char === quote || char === '\\') out += '\\' + char;
        else if (char === '\t') out += '\\t';
        else if (char === '\n') out += '\\n';
        else if (char === '\r') out += '\\r';
        else if (char !== ' ' && NON_PRINTABLE.test(char)) {
            if (cp < 0x100) out += '\\x' + cp.toString(16).padStart(2, '0');
            else if (cp < 0x10000) out += '\\u' + cp.toString(16).padStart(4, '0');
            else out += '\\U' + cp.toString(16).padStart(8, '0');
        } else out += char;
    }

    return out + quote;
};

/** repr() of JSON-like values; arrays render as lists (use pyTupleRepr for tuples). */
export const pyRepr = (value: unknown): string => {
    if (value === null || value === undefined) return 'None';
    if (value === true) return 'True';
    if (value === false) return 'False';
    if (typeof value === 'string') return stringRepr(value);
    if (typeof value === 'number')
        return Number.isInteger(value) ? numberRepr(value) : pyFloatRepr(value);
    if (typeof value === 'bigint') return value.toString();
    if (value instanceof PyFloat) return pyFloatRepr(value.value);
    if (value instanceof PyReprValue) return value.repr;
    if (Array.isArray(value)) return '[' + value.map(pyRepr).join(', ') + ']';
    if (value instanceof Set)
        return value.size ? '{' + [...value].map(pyRepr).join(', ') + '}' : 'set()';
    if (value instanceof Map) {
        return (
            '{' +
            [...value.entries()].map(([k, v]) => pyRepr(k) + ': ' + pyRepr(v)).join(', ') +
            '}'
        );
    }
    if (isPlainObject(value))
        return (
            '{' +
            pyKeys(value)
                .map(k => pyRepr(k) + ': ' + pyRepr(value[k]))
                .join(', ') +
            '}'
        );

    return String(value);
};

/** int(text) for base 10 strings, including Python's whitespace, sign, underscore and Unicode digit rules. */
export const pyInt = (text: string): number | bigint => {
    const stripped = pyStrip(text);
    if (!/^[+-]?\p{Nd}+(?:_\p{Nd}+)*$/u.test(stripped)) {
        throw new Error(`ValueError: invalid literal for int() with base 10: ${pyRepr(text)}`);
    }
    let digits = '';
    for (const char of stripped.replaceAll('_', '')) {
        if (char === '+' || char === '-') {
            digits += char;
            continue;
        }
        // Unicode decimal digits are encoded in contiguous 0-9 runs.
        let cp = char.codePointAt(0) as number;
        let offset = 0;
        while (/\p{Nd}/u.test(String.fromCodePoint(cp - 1))) {
            cp--;
            offset++;
        }
        digits += String(offset % 10);
    }
    const big = BigInt(digits);

    return big >= BigInt(Number.MIN_SAFE_INTEGER) && big <= BigInt(Number.MAX_SAFE_INTEGER)
        ? Number(big)
        : big;
};

export const pyTupleRepr = (items: readonly unknown[]): string =>
    items.length === 1 ? '(' + pyRepr(items[0]) + ',)' : '(' + items.map(pyRepr).join(', ') + ')';

/** str(value) */
export const pyStr = (value: unknown): string => {
    if (typeof value === 'string') return value;
    if (value instanceof PyReprValue) return value.str;

    return pyRepr(value);
};

/** Python type name used in TypeError messages. */
export const pyTypeName = (value: unknown): string => {
    if (value === null || value === undefined) return 'NoneType';
    if (typeof value === 'boolean') return 'bool';
    if (typeof value === 'string') return 'str';
    if (typeof value === 'number') return Number.isInteger(value) ? 'int' : 'float';
    if (typeof value === 'bigint') return 'int';
    if (value instanceof PyFloat) return 'float';
    if (Array.isArray(value)) return 'list';
    if (value instanceof Set) return 'set';
    if (value instanceof Map || isPlainObject(value)) return 'dict';

    return typeof value;
};

/** str + str + ...: TypeError when any operand is not a str (as Python raises). */
export const pyConcat = (...parts: unknown[]): string => {
    let out = '';
    parts.forEach((part, index) => {
        if (typeof part !== 'string') {
            if (index === 0)
                throw new TypeError(
                    `unsupported operand type(s) for +: '${pyTypeName(part)}' and 'str'`,
                );
            throw new TypeError(`can only concatenate str (not "${pyTypeName(part)}") to str`);
        }
        out += part;
    });

    return out;
};

/** A lazy map, like a Python generator expression: fn runs only as items are consumed. */
export function* pyMapIter<T, U>(items: Iterable<T>, fn: (item: T) => U): Generator<U> {
    for (const item of items) yield fn(item);
}

/** separator.join(items): TypeError for any item that is not a str. */
export const pyStrJoin = (separator: string, items: Iterable<unknown>): string => {
    const values: string[] = [];
    for (const item of items) {
        if (typeof item !== 'string') {
            throw new TypeError(
                `sequence item ${values.length}: expected str instance, ${pyTypeName(item)} found`,
            );
        }
        values.push(item);
    }

    return values.join(separator);
};

/** needle in container for str, list and dict containers. */
export const pyIn = (needle: unknown, container: unknown): boolean => {
    if (typeof container === 'string') {
        if (typeof needle !== 'string')
            throw new TypeError(
                `'in <string>' requires string as left operand, not ${pyTypeName(needle)}`,
            );

        return container.includes(needle);
    }
    if (Array.isArray(container)) return container.some(item => pyEquals(item, needle));
    if (isPlainObject(container)) {
        if (Array.isArray(needle) || isPlainObject(needle))
            throw new TypeError(`unhashable type: '${pyTypeName(needle)}'`);

        return typeof needle === 'string' && hasKey(container, needle);
    }
    throw new TypeError(`argument of type '${pyTypeName(container)}' is not iterable`);
};

export class PyAssertionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AssertionError';
    }
}

export class PyKeyError extends Error {
    constructor(key: unknown) {
        super(pyRepr(key));
        this.name = 'KeyError';
    }
}

/** del d[key] keeping the recorded order consistent (a re-added key moves to the end, as in Python). */
export const pyDeleteKey = (obj: JsonObject, key: string): void => {
    if (!Object.hasOwn(obj, key)) throw new PyKeyError(key);
    const order = obj[KEY_ORDER] ? pyKeys(obj).filter(k => k !== key) : undefined;
    delete obj[key];
    if (order) attachOrder(obj, order);
};

/** dict.pop(key[, default]): without a default a missing key raises KeyError. */
export function pyPop(obj: JsonObject, key: string, ...fallback: [Json?]): Json | undefined {
    if (!Object.hasOwn(obj, key)) {
        if (fallback.length) return fallback[0];
        throw new PyKeyError(key);
    }
    const value = obj[key];
    pyDeleteKey(obj, key);

    return value;
}

/**
 * `assert condition, message`. An array message is a Python tuple and renders as its repr;
 * any other message renders as str(message).
 */
export function pyAssert(condition: unknown, message?: unknown): asserts condition {
    if (condition) return;
    if (message === undefined) throw new PyAssertionError('');
    throw new PyAssertionError(Array.isArray(message) ? pyTupleRepr(message) : pyStr(message));
}

/** raise SystemExit(message): message on stderr, exit status 1. */
export const pyExit = (message: string): never => {
    process.stderr.write(message + '\n');
    process.exit(1);
};

/** True when the module whose import.meta.filename is given is the process entry point. */
export const isMain = (moduleFilename: string): boolean => {
    const entry = process.argv[1];
    if (!entry) return false;
    try {
        return fs.realpathSync(nodePath.resolve(entry)) === fs.realpathSync(moduleFilename);
    } catch {
        return nodePath.resolve(entry) === moduleFilename;
    }
};

// ---------------------------------------------------------------------------
// textwrap.fill and argparse for parsers without arguments
// ---------------------------------------------------------------------------

const cpLength = (text: string): number => {
    let n = 0;
    for (const _ of text) n++;

    return n;
};
const cpSlice = (text: string, start: number, end?: number): string =>
    [...text].slice(start, end).join('');

// TextWrapper.wordsep_re with Python's Unicode \w, \d and \W.
const TW_W = '\\p{L}\\p{N}_';
const TW_WORD_PUNCT = `[${TW_W}!"'&.,?]`;
const TW_LETTER = '[\\p{L}\\p{Nl}\\p{No}_]';
const TW_WS = '[\\t\\n\\v\\f\\r ]';
const TW_NWS = '[^\\t\\n\\v\\f\\r ]';
const WORDSEP = new RegExp(
    `(${TW_WS}+|(?<=${TW_WORD_PUNCT})-{2,}(?=[${TW_W}])|${TW_NWS}+?(?:-(?:(?<=${TW_LETTER}{2}-)|(?<=${TW_LETTER}-${TW_LETTER}-))(?=${TW_LETTER}-?${TW_LETTER})|(?=${TW_WS}|(?![\\s\\S]))|(?<=${TW_WORD_PUNCT})(?=-{2,}[${TW_W}])))`,
    'u',
);

/** textwrap.wrap(text, width) with default TextWrapper options. */
export const pyTextwrap = (
    text: string,
    width: number,
    initialIndent = '',
    subsequentIndent = '',
): string[] => {
    if (width <= 0) throw new Error(`ValueError: invalid width ${width} (must be > 0)`);
    // expand_tabs (tabsize 8) then replace_whitespace
    let expanded = '';
    let column = 0;
    for (const char of text) {
        if (char === '\t') {
            const spaces = 8 - (column % 8);
            expanded += ' '.repeat(spaces);
            column += spaces;
        } else if (char === '\n' || char === '\r') {
            expanded += char;
            column = 0;
        } else {
            expanded += char;
            column++;
        }
    }
    const normalized = expanded.replace(/[\t\n\v\f\r]/g, ' ');
    const chunks = normalized.split(WORDSEP).filter(chunk => chunk);
    chunks.reverse();
    const lines: string[] = [];
    while (chunks.length) {
        const current: string[] = [];
        let currentLength = 0;
        const indent = lines.length ? subsequentIndent : initialIndent;
        const lineWidth = width - cpLength(indent);
        if (pyStrip(chunks[chunks.length - 1]) === '' && lines.length) chunks.pop();
        while (chunks.length) {
            const chunkLength = cpLength(chunks[chunks.length - 1]);
            if (currentLength + chunkLength <= lineWidth) {
                current.push(chunks.pop() as string);
                currentLength += chunkLength;
            } else break;
        }
        if (chunks.length && cpLength(chunks[chunks.length - 1]) > lineWidth) {
            const spaceLeft = lineWidth < 1 ? 1 : lineWidth - currentLength;
            if (spaceLeft > 0) {
                const chunk = chunks[chunks.length - 1];
                let end = spaceLeft;
                if (cpLength(chunk) > spaceLeft) {
                    const head = cpSlice(chunk, 0, spaceLeft);
                    const hyphen = head.lastIndexOf('-');
                    if (
                        hyphen > 0 &&
                        [...cpSlice(chunk, 0, cpLength(head.slice(0, hyphen)))].some(c => c !== '-')
                    ) {
                        end = cpLength(head.slice(0, hyphen)) + 1;
                    }
                }
                current.push(cpSlice(chunk, 0, end));
                chunks[chunks.length - 1] = cpSlice(chunk, end);
            } else if (!current.length) {
                current.push(chunks.pop() as string);
            }
        }
        if (current.length && pyStrip(current[current.length - 1]) === '') {
            current.pop();
        }
        if (current.length) lines.push(indent + current.join(''));
    }

    return lines;
};

/** shutil.get_terminal_size().columns */
export const pyTerminalColumns = (): number => {
    const fromEnv = Number.parseInt(process.env.COLUMNS ?? '', 10);
    if (fromEnv > 0) return fromEnv;
    if (process.stdout.isTTY && process.stdout.columns) return process.stdout.columns;

    return 80;
};

/** HelpFormatter._format_usage for a parser whose only optional is -h (wraps on narrow terminals). */
export const pyArgparseUsage = (prog: string): string => {
    const prefix = 'usage: ';
    const textWidth = pyTerminalColumns() - 2;
    const usage = `${prog} [-h]`;
    if (prefix.length + usage.length <= textWidth) return prefix + usage + '\n';
    const getLines = (parts: string[], indent: string, withPrefix: boolean): string[] => {
        const lines: string[] = [];
        let line: string[] = [];
        let lineLength = withPrefix ? prefix.length - 1 : indent.length - 1;
        for (const part of parts) {
            if (lineLength + 1 + part.length > textWidth && line.length) {
                lines.push(indent + line.join(' '));
                line = [];
                lineLength = indent.length - 1;
            }
            line.push(part);
            lineLength += part.length + 1;
        }
        if (line.length) lines.push(indent + line.join(' '));
        if (withPrefix) lines[0] = lines[0].slice(indent.length);

        return lines;
    };
    let lines: string[];
    if (prefix.length + prog.length <= 0.75 * textWidth) {
        lines = getLines([prog, '[-h]'], ' '.repeat(prefix.length + prog.length + 1), true);
    } else {
        lines = [prog, ...getLines(['[-h]'], ' '.repeat(prefix.length), false)];
    }

    return prefix + lines.join('\n') + '\n';
};

/** argparse help text for ArgumentParser(description=description) with no arguments. */
export const pyArgparseHelp = (prog: string, description: string | undefined): string => {
    const width = pyTerminalColumns() - 2;
    let help = pyArgparseUsage(prog) + '\n';
    if (description) {
        const collapsed = pyStrip(description.replace(/[ \t\n\r\f\v]+/g, ' '));
        help += pyTextwrap(collapsed, Math.max(width, 11)).join('\n') + '\n\n';
    }
    const maxHelpPosition = Math.min(24, Math.max(width - 20, 4));
    const header = '-h, --help';
    const helpPosition = Math.min(header.length + 2 + 2, maxHelpPosition);
    const helpWidth = Math.max(width - helpPosition, 11);
    const actionWidth = helpPosition - 2 - 2;
    const helpLines = pyTextwrap('show this help message and exit', helpWidth);
    help += 'options:\n';
    if (header.length <= actionWidth) {
        help += '  ' + header.padEnd(actionWidth) + '  ' + helpLines[0] + '\n';
        for (const line of helpLines.slice(1)) help += ' '.repeat(helpPosition) + line + '\n';
    } else {
        help += '  ' + header + '\n';
        for (const line of helpLines) help += ' '.repeat(helpPosition) + line + '\n';
    }

    return help;
};

/**
 * argparse.ArgumentParser(description=...).parse_args() for a parser without arguments:
 * -h/--help prints help and exits 0; anything else is an error with exit status 2.
 */
export const pyParseNoArgs = (
    prog: string,
    description: string | undefined,
    argv: readonly string[] = process.argv.slice(2),
): void => {
    const usage = pyArgparseUsage(prog);
    const error = (message: string): never => {
        process.stderr.write(usage + `${prog}: error: ${message}\n`);
        process.exit(2);
    };
    const unrecognized: string[] = [];
    let positionalOnly = false;
    for (const arg of argv) {
        if (positionalOnly) {
            unrecognized.push(arg);
            continue;
        }
        if (arg === '--') {
            positionalOnly = true;
            unrecognized.push(arg);
            continue;
        }
        if (arg.startsWith('--')) {
            const eq = arg.indexOf('=');
            const option = eq >= 0 ? arg.slice(0, eq) : arg;
            if ('--help'.startsWith(option)) {
                if (eq >= 0)
                    error(
                        `argument -h/--help: ignored explicit argument ${pyRepr(arg.slice(eq + 1))}`,
                    );
                process.stdout.write(pyArgparseHelp(prog, description));
                process.exit(0);
            }
            unrecognized.push(arg);
            continue;
        }
        if (arg.startsWith('-h')) {
            process.stdout.write(pyArgparseHelp(prog, description));
            process.exit(0);
        }
        unrecognized.push(arg);
    }
    if (unrecognized.length) error(`unrecognized arguments: ${unrecognized.join(' ')}`);
};

// ---------------------------------------------------------------------------
// re: Python pattern syntax and Unicode classes on JS RegExp
// ---------------------------------------------------------------------------

const RE_WORD = '\\p{L}\\p{N}_';
const RE_BOUNDARY = `(?:(?<=[${RE_WORD}])(?![${RE_WORD}])|(?<![${RE_WORD}])(?=[${RE_WORD}]))`;
const RE_NON_BOUNDARY = `(?:(?<=[${RE_WORD}])(?=[${RE_WORD}])|(?<![${RE_WORD}])(?![${RE_WORD}]))`;
const JS_SYNTAX = new Set('^$\\.*+?()[]{}|/');

/**
 * Compile a Python `re` pattern (str pattern, no flags other than IGNORECASE/DOTALL) to an equivalent
 * JS RegExp with the u flag: Unicode \w \s \d \b, Python `.` and `$`, (?P<name>...), literal escapes.
 */
export const pyRe = (
    pattern: string,
    flags: { ignoreCase?: boolean; dotAll?: boolean; global?: boolean } = {},
): RegExp => {
    let out = '';
    let inClass = false;
    const chars = [...pattern];
    const unsupported = (what: string): never => {
        throw new Error(`pyRe: unsupported Python regex construct ${what} in ${pattern}`);
    };
    for (let i = 0; i < chars.length; i++) {
        const c = chars[i];
        if (c === '\\') {
            const next = chars[++i];
            if (next === undefined) unsupported('trailing backslash');
            if (inClass) {
                if (next === 'w') out += RE_WORD;
                else if (next === 's') out += PY_SPACE_CLASS;
                else if (next === 'd') out += '\\p{Nd}';
                else if (next === 'b') out += '\\x08';
                else if (next === 'a') out += '\\x07';
                else if ('ntrfv'.includes(next)) out += '\\' + next;
                else if (next === 'x') {
                    out += '\\x' + chars[i + 1] + chars[i + 2];
                    i += 2;
                } else if (next === 'u') {
                    out += '\\u' + chars.slice(i + 1, i + 5).join('');
                    i += 4;
                } else if (next === 'U') {
                    out += '\\u{' + chars.slice(i + 1, i + 9).join('') + '}';
                    i += 8;
                } else if (/[\p{L}\p{N}]/u.test(next)) unsupported('\\' + next);
                else out += JS_SYNTAX.has(next) || next === '-' ? '\\' + next : next;
                continue;
            }
            if (next === 'w') out += `[${RE_WORD}]`;
            else if (next === 'W') out += `[^${RE_WORD}]`;
            else if (next === 's') out += `[${PY_SPACE_CLASS}]`;
            else if (next === 'S') out += `[^${PY_SPACE_CLASS}]`;
            else if (next === 'd') out += '\\p{Nd}';
            else if (next === 'D') out += '\\P{Nd}';
            else if (next === 'b') out += RE_BOUNDARY;
            else if (next === 'B') out += RE_NON_BOUNDARY;
            else if (next === 'A') out += '(?<![\\s\\S])';
            else if (next === 'Z') out += '(?![\\s\\S])';
            else if (next === 'a') out += '\\x07';
            else if ('ntrfv'.includes(next)) out += '\\' + next;
            else if (/[1-9]/.test(next)) out += '\\' + next;
            else if (next === 'x') {
                out += '\\x' + chars[i + 1] + chars[i + 2];
                i += 2;
            } else if (next === 'u') {
                out += '\\u' + chars.slice(i + 1, i + 5).join('');
                i += 4;
            } else if (next === 'U') {
                out += '\\u{' + chars.slice(i + 1, i + 9).join('') + '}';
                i += 8;
            } else if (/[\p{L}\p{N}]/u.test(next)) unsupported('\\' + next);
            else out += JS_SYNTAX.has(next) ? '\\' + next : next;
            continue;
        }
        if (inClass) {
            if (c === ']') {
                inClass = false;
                out += ']';
            } else if (c === '[') out += '\\[';
            else out += c;
            continue;
        }
        if (c === '[') {
            inClass = true;
            out += '[';
            if (chars[i + 1] === '^') {
                out += '^';
                i++;
            }
            if (chars[i + 1] === ']') {
                out += '\\]';
                i++;
            }
        } else if (c === '.') out += flags.dotAll ? '[\\s\\S]' : '[^\\n]';
        else if (c === '$') out += '(?=\\n?(?![\\s\\S]))';
        else if (c === '(' && chars[i + 1] === '?') {
            const rest = chars.slice(i + 2, i + 4).join('');
            if (rest.startsWith('P<')) {
                out += '(?<';
                i += 3;
            } else if (rest.startsWith('P=')) {
                const close = chars.indexOf(')', i);
                out += '\\k<' + chars.slice(i + 4, close).join('') + '>';
                i = close;
            } else if (rest.startsWith('#')) {
                i = chars.indexOf(')', i);
            } else if (/^[:=!]/.test(rest) || rest === '<=' || rest === '<!') {
                out += '(?';
                i += 1;
            } else unsupported('(?' + rest);
        } else if (c === '{') {
            const quantifier = /^\{(\d*)(,\d*)?\}/.exec(chars.slice(i).join(''));
            if (quantifier && (quantifier[1] !== '' || (quantifier[2] ?? ',').length > 1)) {
                out += quantifier[1] === '' ? '{0' + quantifier[0].slice(1) : quantifier[0];
                i += [...quantifier[0]].length - 1;
            } else out += '\\{';
        } else if (c === '}') out += '\\}';
        else if ((c === '*' || c === '+' || c === '?' || c === '}') && chars[i + 1] === '+')
            unsupported('possessive quantifier');
        else out += c;
    }
    if (inClass) unsupported('unterminated character set');

    return new RegExp(out, 'u' + (flags.ignoreCase ? 'i' : '') + (flags.global ? 'g' : ''));
};

/** re.escape(text) (Python 3.7+ special characters only). */
export const pyReEscape = (text: string): string =>
    text.replace(/[()[\]{}?*+\-|^$\\.&~# \t\n\r\v\f]/g, '\\$&');

const toGlobal = (regex: RegExp): RegExp =>
    regex.global
        ? new RegExp(regex.source, regex.flags)
        : new RegExp(regex.source, regex.flags + 'g');

/** re.findall: whole matches, group 1 strings, or tuples (arrays) for several groups; unmatched groups are ''. */
export const pyFindall = (regex: RegExp, text: string): (string | string[])[] =>
    [...text.matchAll(toGlobal(regex))].map(match => {
        if (match.length === 1) return match[0];
        if (match.length === 2) return match[1] ?? '';

        return match.slice(1).map(group => group ?? '');
    });

/** re.finditer */
export const pyFinditer = (regex: RegExp, text: string): RegExpExecArray[] => [
    ...text.matchAll(toGlobal(regex)),
];

/** re.search */
export const pySearch = (regex: RegExp, text: string): RegExpExecArray | null =>
    new RegExp(regex.source, regex.flags.replace('g', '')).exec(text);

/** re.match (anchored at the start) */
export const pyMatch = (regex: RegExp, text: string): RegExpExecArray | null => {
    const sticky = new RegExp(regex.source, regex.flags.replace('g', '') + 'y');
    sticky.lastIndex = 0;

    return sticky.exec(text);
};

// ---------------------------------------------------------------------------
// fnmatch
// ---------------------------------------------------------------------------

type GlobToken =
    | { kind: 'star' }
    | { kind: 'any' }
    | { kind: 'char'; cp: number }
    | { kind: 'set'; negate: boolean; ranges: [number, number][]; never: boolean; always: boolean };

// Interpret the body of a Python regex character set built by fnmatch (escapes are literal characters).
const parseClassContent = (stuff: string): [number, number][] => {
    const items: { cp: number; escaped: boolean }[] = [];
    const chars = [...stuff];
    for (let i = 0; i < chars.length; i++) {
        if (chars[i] === '\\' && i + 1 < chars.length) {
            items.push({ cp: chars[++i].codePointAt(0) as number, escaped: true });
        } else items.push({ cp: chars[i].codePointAt(0) as number, escaped: false });
    }
    const ranges: [number, number][] = [];
    for (let i = 0; i < items.length; i++) {
        const isRange = i + 2 < items.length && items[i + 1].cp === 0x2d && !items[i + 1].escaped;
        if (isRange) {
            const low = items[i].cp;
            const high = items[i + 2].cp;
            if (low > high) throw new Error('re.error: bad character range');
            ranges.push([low, high]);
            i += 2;
        } else ranges.push([items[i].cp, items[i].cp]);
    }

    return ranges;
};

// fnmatch._translate: produces the same character-set content Python builds, then interprets it.
const tokenizeGlob = (pattern: string): GlobToken[] => {
    const pat = [...pattern];
    const n = pat.length;
    const tokens: GlobToken[] = [];
    let i = 0;
    while (i < n) {
        const c = pat[i];
        i++;
        if (c === '*') {
            if (!tokens.length || tokens[tokens.length - 1].kind !== 'star')
                tokens.push({ kind: 'star' });
        } else if (c === '?') {
            tokens.push({ kind: 'any' });
        } else if (c === '[') {
            let j = i;
            if (j < n && pat[j] === '!') j++;
            if (j < n && pat[j] === ']') j++;
            while (j < n && pat[j] !== ']') j++;
            if (j >= n) {
                tokens.push({ kind: 'char', cp: 0x5b });
                continue;
            }
            let stuff: string;
            const between = pat.slice(i, j).join('');
            if (!between.includes('-')) {
                stuff = between.replaceAll('\\', '\\\\');
            } else {
                const chunks: string[] = [];
                let k = pat[i] === '!' ? i + 2 : i + 1;
                for (;;) {
                    k = pat.slice(0, j).indexOf('-', k);
                    if (k < 0) break;
                    chunks.push(pat.slice(i, k).join(''));
                    i = k + 1;
                    k = k + 3;
                }
                const chunk = pat.slice(i, j).join('');
                if (chunk) chunks.push(chunk);
                else chunks[chunks.length - 1] += '-';
                for (let m = chunks.length - 1; m > 0; m--) {
                    const prev = [...chunks[m - 1]];
                    const cur = [...chunks[m]];
                    if (pyCompareStrings(prev[prev.length - 1], cur[0]) > 0) {
                        chunks[m - 1] = prev.slice(0, -1).join('') + cur.slice(1).join('');
                        chunks.splice(m, 1);
                    }
                }
                stuff = chunks
                    .map(s => s.replaceAll('\\', '\\\\').replaceAll('-', '\\-'))
                    .join('-');
            }
            stuff = stuff.replace(/[&~|]/g, '\\$&');
            i = j + 1;
            if (!stuff)
                tokens.push({ kind: 'set', negate: false, ranges: [], never: true, always: false });
            else if (stuff === '!')
                tokens.push({ kind: 'set', negate: false, ranges: [], never: false, always: true });
            else {
                let negate = false;
                if (stuff[0] === '!') {
                    negate = true;
                    stuff = stuff.slice(1);
                } else if (stuff[0] === '^' || stuff[0] === '[') stuff = '\\' + stuff;
                tokens.push({
                    kind: 'set',
                    negate,
                    ranges: parseClassContent(stuff),
                    never: false,
                    always: false,
                });
            }
        } else {
            tokens.push({ kind: 'char', cp: c.codePointAt(0) as number });
        }
    }

    return tokens;
};

const matchGlobTokens = (tokens: GlobToken[], name: number[]): boolean => {
    const memo = new Map<number, boolean>();
    const matchAt = (ti: number, ni: number): boolean => {
        const key = ti * (name.length + 1) + ni;
        const cached = memo.get(key);
        if (cached !== undefined) return cached;
        let result: boolean;
        if (ti === tokens.length) result = ni === name.length;
        else {
            const token = tokens[ti];
            if (token.kind === 'star') {
                result = false;
                for (let k = ni; k <= name.length && !result; k++) result = matchAt(ti + 1, k);
            } else if (ni >= name.length) result = false;
            else if (token.kind === 'any') result = matchAt(ti + 1, ni + 1);
            else if (token.kind === 'char')
                result = token.cp === name[ni] && matchAt(ti + 1, ni + 1);
            else {
                const cp = name[ni];
                const inSet =
                    token.always ||
                    (!token.never && token.ranges.some(([low, high]) => cp >= low && cp <= high));
                let tokenMatches: boolean;
                if (token.never) tokenMatches = false;
                else if (token.always) tokenMatches = true;
                else tokenMatches = token.negate ? !inSet : inSet;
                result = tokenMatches && matchAt(ti + 1, ni + 1);
            }
        }
        memo.set(key, result);

        return result;
    };

    return matchAt(0, 0);
};

/** fnmatch.fnmatch(name, pattern) on POSIX (case-sensitive; * and ? also match /). */
export const fnmatch = (name: string, pattern: string): boolean =>
    matchGlobTokens(
        tokenizeGlob(pattern),
        [...name].map(c => c.codePointAt(0) as number),
    );

// ---------------------------------------------------------------------------
// pathlib / file I/O
// ---------------------------------------------------------------------------

/** str(PurePosixPath(path)): collapse slashes, drop '.' parts, keep '..', '' -> '.'. */
export const pyPathStr = (path: string): string => {
    let root = '';
    let rest = path;
    if (path.startsWith('/')) {
        if (path[1] === '/' && path[2] !== '/') {
            root = '//';
            rest = path.slice(2);
        } else {
            root = '/';
            rest = path.slice(1);
        }
    }
    const parts = rest.split('/').filter(part => part && part !== '.');
    const result = root + parts.join('/');

    return result || '.';
};

/** A PosixPath for assertion messages: str() is the normalized path, repr() is PosixPath('...'). */
export const pyPathValue = (path: string): PyReprValue => {
    const normalized = pyPathStr(path);

    return new PyReprValue(`PosixPath(${pyRepr(normalized)})`, normalized);
};

/** PurePosixPath(path).parts */
export const pyPathParts = (path: string): string[] => {
    const normalized = pyPathStr(path);
    if (normalized === '.') return [];
    if (normalized.startsWith('//'))
        return ['//', ...normalized.slice(2).split('/').filter(Boolean)];
    if (normalized.startsWith('/')) return ['/', ...normalized.slice(1).split('/').filter(Boolean)];

    return normalized.split('/');
};

export const pyIsAbsolute = (path: string): boolean => path.startsWith('/');

/** Path(base) / part / ...: an absolute part restarts the path; the result is normalized like str(Path). */
export const pyJoin = (base: string, ...parts: string[]): string => {
    let result = base;
    for (const part of parts) result = pyIsAbsolute(part) ? part : result + '/' + part;

    return pyPathStr(result);
};

const pyName = (path: string): string => {
    const parts = pyPathParts(path);
    const last = parts[parts.length - 1] ?? '';

    return last === '/' || last === '//' ? '' : last;
};

/** PurePath.name */
export const pyPathName = pyName;

/** PurePath.suffix (3.13) */
export const pySuffix = (path: string): string => {
    const name = pyName(path);
    const i = name.lastIndexOf('.');

    return i > 0 && i < name.length - 1 ? name.slice(i) : '';
};

/** PurePath.stem (3.13) */
export const pyStem = (path: string): string => {
    const name = pyName(path);
    const i = name.lastIndexOf('.');

    return i > 0 && i < name.length - 1 ? name.slice(0, i) : name;
};

/** PurePath.parent */
export const pyParent = (path: string): string => {
    const parts = pyPathParts(path);
    if (!parts.length) return '.';
    const anchored = parts[0] === '/' || parts[0] === '//';
    if (anchored && parts.length === 1) return parts[0];
    const parentParts = parts.slice(0, -1);
    if (!parentParts.length) return '.';
    if (anchored) return parentParts[0] + parentParts.slice(1).join('/');

    return parentParts.join('/');
};

/** Path.resolve() (os.path.realpath(strict=False) in Python 3.13). */
export const pyResolve = (path: string): string => {
    const rest: (string | null)[] = path.split('/').reverse();
    let partCount = rest.length;
    let resolved = path.startsWith('/') ? '/' : process.cwd();
    const seen = new Map<string, string | null>();
    while (partCount) {
        const name = rest.pop();
        if (name === null) {
            seen.set(rest.pop() as string, resolved);
            continue;
        }
        partCount--;
        if (!name || name === '.') continue;
        if (name === '..') {
            resolved = resolved.slice(0, resolved.lastIndexOf('/')) || '/';
            continue;
        }
        const newPath = resolved === '/' ? '/' + name : resolved + '/' + name;
        let target: string;
        try {
            const stat = fs.lstatSync(newPath);
            if (!stat.isSymbolicLink()) {
                resolved = newPath;
                continue;
            }
            if (seen.has(newPath)) {
                const cached = seen.get(newPath);
                resolved = cached ?? newPath;
                continue;
            }
            target = fs.readlinkSync(newPath);
        } catch {
            resolved = newPath;
            continue;
        }
        if (target.startsWith('/')) resolved = '/';
        seen.set(newPath, null);
        rest.push(newPath);
        rest.push(null);
        const targetParts = target.split('/').reverse();
        rest.push(...targetParts);
        partCount += targetParts.length;
    }

    return resolved;
};

/** PurePath.is_relative_to(other) (lexical). */
export const pyIsRelativeTo = (path: string, other: string): boolean => {
    const self = pyPathParts(path);
    const base = pyPathParts(other);

    return base.length <= self.length && base.every((part, index) => part === self[index]);
};

/** str(PurePath(path).relative_to(other)); raises ValueError like Python when not a subpath. */
export const pyRelativeTo = (path: string, other: string): string => {
    if (!pyIsRelativeTo(path, other)) {
        throw new Error(
            `ValueError: ${pyRepr(pyPathStr(path))} is not in the subpath of ${pyRepr(pyPathStr(other))}`,
        );
    }
    const tail = pyPathParts(path).slice(pyPathParts(other).length);

    return tail.length ? tail.join('/') : '.';
};

/** Ordering of pathlib paths (sorted(paths)): compares '/'-separated components, not whole strings. */
export const pyComparePaths = (a: string, b: string): number => {
    const left = pyPathStr(a).split('/');
    const right = pyPathStr(b).split('/');
    const n = Math.min(left.length, right.length);
    for (let i = 0; i < n; i++) {
        const order = pyCompareStrings(left[i], right[i]);
        if (order) return order;
    }

    if (left.length - right.length < 0) return -1;

    return left.length > right.length ? 1 : 0;
};

/** sorted(paths) for pathlib paths given as strings. */
export const pySortedPaths = (paths: Iterable<string>): string[] => [...paths].sort(pyComparePaths);

/** Path.is_file() (follows symlinks, False on any error). */
export const pyIsFile = (path: string): boolean => {
    try {
        return fs.statSync(path).isFile();
    } catch {
        return false;
    }
};

/** Path.is_dir() */
export const pyIsDir = (path: string): boolean => {
    try {
        return fs.statSync(path).isDirectory();
    } catch {
        return false;
    }
};

/** Path.exists() */
export const pyExists = (path: string): boolean => {
    try {
        fs.statSync(path);

        return true;
    } catch {
        return false;
    }
};

/** Universal-newline translation applied by text-mode reads (\r\n and \r become \n). */
export const universalNewlines = (text: string): string => text.replace(/\r\n?/g, '\n');

/** bytes.decode('utf-8', errors) — the BOM is kept, as Python's utf-8 codec does. */
export const pyDecodeUtf8 = (bytes: Uint8Array, errors: 'strict' | 'replace' = 'strict'): string =>
    new TextDecoder('utf-8', { fatal: errors === 'strict', ignoreBOM: true }).decode(bytes);

/**
 * Path.read_text(errors=...) (newline=None translates line endings) or open(path, newline='').read()
 * when newline is ''.
 */
export const readText = (
    path: string,
    options: { errors?: 'strict' | 'replace'; newline?: '' | null } = {},
): string => {
    const text = pyDecodeUtf8(fs.readFileSync(path), options.errors ?? 'strict');

    return options.newline === '' ? text : universalNewlines(text);
};

/** json.loads(Path(path).read_text()) */
export const readJson = (path: string): Json => pyJsonLoads(readText(path));

/** Path.read_bytes() */
export const readBytes = (path: string): Buffer => fs.readFileSync(path);

/** Path.write_text(text): UTF-8 strict; the file is truncated before an encoding error is raised. */
export const writeText = (path: string, text: string): void => {
    let encoded: Buffer;
    try {
        encoded = pyEncode(text);
    } catch (error) {
        fs.writeFileSync(path, '');
        throw error;
    }
    fs.writeFileSync(path, encoded);
};

/** build.dump: Path(name).write_text(json.dumps(value, indent=4, ensure_ascii=False) + "\n") */
export const dumpJson = (path: string, value: unknown): void =>
    writeText(path, pyJsonDumps(value, { indent: 4, ensureAscii: false }) + '\n');

// pathlib glob (Python 3.13, recurse_symlinks=False): '**' does not descend into symlinked directories,
// '*' matches hidden names, a wildcard followed by more parts keeps entries whose is_dir() follows symlinks.
type GlobSelector = (path: string, exists: boolean) => string[];

const MAGIC = /[*?[]/;
const addSlash = (path: string) => (!path || path.endsWith('/') ? path : path + '/');
const entryPath = (dir: string, name: string) => {
    if (dir === '') return name;

    return dir.endsWith('/') ? dir + name : dir + '/' + name;
};
const listDir = (path: string): fs.Dirent[] | undefined => {
    try {
        return fs.readdirSync(path || '.', { withFileTypes: true });
    } catch {
        return undefined;
    }
};
const direntIsDir = (dir: string, entry: fs.Dirent, followSymlinks: boolean): boolean => {
    if (entry.isDirectory()) return true;
    if (!followSymlinks || !entry.isSymbolicLink()) return false;

    return pyIsDir(entryPath(dir, entry.name));
};

const globSelector = (parts: string[]): GlobSelector => {
    if (!parts.length) {
        return (path, exists) => {
            if (exists) return [path];
            try {
                fs.lstatSync(path);

                return [path];
            } catch {
                return [];
            }
        };
    }
    let part = parts.pop() as string;
    if (part === '**') {
        while (parts.length && parts[parts.length - 1] === '**') parts.pop();
        const dirOnly = parts.length > 0;
        const selectNext = globSelector(parts);

        return (start, exists) => {
            const root = addSlash(start);
            const results = [...selectNext(root, exists)];
            const stack = [root];
            while (stack.length) {
                const dir = stack.pop() as string;
                const entries = listDir(dir);
                if (!entries) continue;
                for (const entry of entries) {
                    const isDir = direntIsDir(dir, entry, false);
                    if (isDir || !dirOnly) {
                        const child = entryPath(dir, entry.name);
                        if (dirOnly) results.push(...selectNext(child, true));
                        else results.push(child);
                        if (isDir) stack.push(child);
                    }
                }
            }

            return results;
        };
    }
    if (part === '' || part === '.' || part === '..') {
        const selectNext = globSelector(parts);

        return (path, exists) => selectNext(addSlash(path) + part, exists);
    }
    if (!MAGIC.test(part)) {
        while (parts.length && !MAGIC.test(parts[parts.length - 1])) part += '/' + parts.pop();
        const selectNext = globSelector(parts);

        return path => selectNext(addSlash(path) + part, false);
    }
    const tokens = part === '*' ? undefined : tokenizeGlob(part);
    const dirOnly = parts.length > 0;
    const selectNext = dirOnly ? globSelector(parts) : undefined;

    return path => {
        const entries = listDir(path);
        if (!entries) return [];
        const results: string[] = [];
        for (const entry of entries) {
            if (
                tokens &&
                !matchGlobTokens(
                    tokens,
                    [...entry.name].map(c => c.codePointAt(0) as number),
                )
            )
                continue;
            if (selectNext) {
                if (!direntIsDir(path, entry, true)) continue;
                results.push(...selectNext(entryPath(path, entry.name), true));
            } else results.push(entryPath(path, entry.name));
        }

        return results;
    };
};

/** [str(p) for p in Path(root).glob(pattern)] — order follows the directory listing; sort before use. */
export const pyGlob = (root: string, pattern: string): string[] => {
    if (pattern.startsWith('/'))
        throw new Error('NotImplementedError: Non-relative patterns are unsupported');
    const parts = pattern.split('/').filter(part => part && part !== '.');
    if (!parts.length) throw new Error(`ValueError: Unacceptable pattern: ${pyRepr(pattern)}`);
    if (pattern.endsWith('/')) parts.push('');
    const select = globSelector([...parts].reverse());
    let paths = select(pyPathStr(root), false);
    if (parts[parts.length - 1] === '**') paths = paths.filter(p => !p.endsWith('/'));

    return paths.map(pyPathStr);
};

/** Path(root).rglob(pattern) */
export const pyRglob = (root: string, pattern: string): string[] => pyGlob(root, '**/' + pattern);

// ---------------------------------------------------------------------------
// subprocess / git
// ---------------------------------------------------------------------------

/** subprocess.check_output(['git', *args], cwd=cwd, text=True).strip() */
export const gitIn = (cwd: string, ...args: string[]): string => {
    const output = execFileSync('git', args, {
        cwd,
        stdio: ['inherit', 'pipe', 'inherit'],
        maxBuffer: 1024 * 1024 * 1024,
    });

    return pyStrip(universalNewlines(pyDecodeUtf8(output)));
};

/** build.git(*args): git in the repository root. */
export const git = (...args: string[]): string => gitIn(REPO_ROOT, ...args);

// ---------------------------------------------------------------------------
// csv (excel dialect, QUOTE_MINIMAL)
// ---------------------------------------------------------------------------

const csvField = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    const text = pyStr(value);
    if (/[",\r\n]/.test(text)) return '"' + text.replaceAll('"', '""') + '"';

    return text;
};

/** csv.writer(..., lineterminator='\n').writerow(values): LF rows, so generated CSVs pass `git diff --check`. */
export const pyCsvRow = (values: readonly unknown[]): string => {
    if (values.length === 1) {
        const only = values[0];
        if (only === null || only === undefined || only === '') return '""\n';
    }

    return values.map(csvField).join(',') + '\n';
};

/** csv.DictWriter(fieldnames=...): writeheader() + writerows(rows) as one string. */
export const pyCsvDictRows = (
    fieldnames: readonly string[],
    rows: Iterable<object>,
    restval: unknown = '',
): string => {
    const allowed = new Set(fieldnames);
    const out = [pyCsvRow(fieldnames)];
    for (const row of rows) {
        const record = row as Record<string, unknown>;
        const keys = row instanceof Map ? [...row.keys()].map(String) : pyKeys(row);
        const wrong = keys.filter(key => !allowed.has(key));
        if (wrong.length)
            throw new Error(
                'ValueError: dict contains fields not in fieldnames: ' +
                    wrong.map(pyRepr).join(', '),
            );
        out.push(
            pyCsvRow(
                fieldnames.map(name => {
                    if (row instanceof Map) return row.has(name) ? row.get(name) : restval;

                    return Object.hasOwn(record, name) ? record[name] : restval;
                }),
            ),
        );
    }

    return out.join('');
};

/** build.write_csv(name, columns, rows): open(path, 'w', newline='') + DictWriter. */
export const writeCsv = (
    path: string,
    fieldnames: readonly string[],
    rows: Iterable<object>,
): void => writeText(path, pyCsvDictRows(fieldnames, rows));

const CSV_FIELD_LIMIT = 131072;

/** Lines of a stream opened with newline='': each ends after \n, \r\n or a lone \r. */
const streamLines = (text: string): string[] =>
    text.match(/[^\r\n]*(?:\r\n|\r|\n)|[^\r\n]+$/g) ?? [];

/**
 * csv.reader over text read with newline='' (excel dialect, strict=False), following
 * CPython's Modules/_csv.c: each line is fed character by character followed by an end-of-line marker.
 */
export const pyCsvReader = (text: string): string[][] => {
    const rows: string[][] = [];
    let fields: string[] = [];
    let field: string[] = [];
    let state: 'startRecord' | 'startField' | 'inField' | 'inQuoted' | 'quoteInQuoted' | 'eatCrnl' =
        'startRecord';
    const addChar = (c: string) => {
        if (field.length >= CSV_FIELD_LIMIT)
            throw new Error(`_csv.Error: field larger than field limit (${CSV_FIELD_LIMIT})`);
        field.push(c);
    };
    const saveField = () => {
        fields.push(field.join(''));
        field = [];
    };
    // c === null is the end-of-line marker (EOL in _csv.c).
    const processChar = (c: string | null): void => {
        const newline = c === '\n' || c === '\r';
        switch (state) {
            case 'startRecord':
                if (c === null) return;
                if (newline) {
                    state = 'eatCrnl';

                    return;
                }
                state = 'startField';
            // falls through
            case 'startField':
                if (newline || c === null) {
                    saveField();
                    state = c === null ? 'startRecord' : 'eatCrnl';
                } else if (c === '"') state = 'inQuoted';
                else if (c === ',') saveField();
                else {
                    addChar(c);
                    state = 'inField';
                }

                return;
            case 'inField':
                if (newline || c === null) {
                    saveField();
                    state = c === null ? 'startRecord' : 'eatCrnl';
                } else if (c === ',') {
                    saveField();
                    state = 'startField';
                } else addChar(c);

                return;
            case 'inQuoted':
                if (c === null) return;
                if (c === '"') state = 'quoteInQuoted';
                else addChar(c);

                return;
            case 'quoteInQuoted':
                if (c === '"') {
                    addChar(c);
                    state = 'inQuoted';
                } else if (c === ',') {
                    saveField();
                    state = 'startField';
                } else if (newline || c === null) {
                    saveField();
                    state = c === null ? 'startRecord' : 'eatCrnl';
                } else {
                    addChar(c);
                    state = 'inField';
                }

                return;
            case 'eatCrnl':
                if (newline) return;
                if (c === null) {
                    state = 'startRecord';

                    return;
                }
                throw new Error(
                    "_csv.Error: new-line character seen in unquoted field - do you need to open the file with newline=''?",
                );
        }
    };
    const lines = streamLines(text);
    let index = 0;
    for (;;) {
        // One Reader_iternext call.
        fields = [];
        field = [];
        let done = false;
        do {
            if (index >= lines.length) {
                // state is mutated inside processChar, which narrowing does not see.
                if (field.length !== 0 || (state as string) === 'inQuoted') {
                    saveField();
                    state = 'startRecord';
                    break;
                }
                done = true;
                break;
            }
            for (const c of lines[index++]) processChar(c);
            processChar(null);
        } while (state !== 'startRecord');
        if (done) return rows;
        rows.push(fields);
    }
};

export type CsvDictRow = { [key: string]: string | null; [CSV_REST_KEY]?: string[] };

/** list(csv.DictReader(stream)): blank data rows skipped; short rows get null, surplus values go to CSV_REST_KEY. */
export const pyCsvDictReader = (text: string): CsvDictRow[] => {
    const rows = pyCsvReader(text);
    if (!rows.length) return [];
    // The first row is the header even when it is blank; later blank rows are skipped.
    let index = 0;
    const fieldnames = rows[index++];
    const result: CsvDictRow[] = [];
    for (; index < rows.length; index++) {
        const row = rows[index];
        if (!row.length) continue;
        const record: CsvDictRow = {};
        fieldnames.forEach((name, i) => {
            record[name] = i < row.length ? row[i] : null;
        });
        if (row.length > fieldnames.length) record[CSV_REST_KEY] = row.slice(fieldnames.length);
        result.push(record);
    }

    return result;
};

// ---------------------------------------------------------------------------
// xml.etree.ElementTree (subset used by the feature map)
// ---------------------------------------------------------------------------

export type XmlElement = {
    tag: string;
    attrib: Map<string, string>;
    text: string | null;
    tail: string | null;
    children: XmlElement[];
};

/** ET.Element(tag, attrib) */
export const xmlElement = (
    tag: string,
    attrib: Record<string, string> | Map<string, string> = {},
): XmlElement => ({
    tag,
    attrib: attrib instanceof Map ? new Map(attrib) : new Map(Object.entries(attrib)),
    text: null,
    tail: null,
    children: [],
});

/** ET.SubElement(parent, tag, attrib) */
export const xmlSubElement = (
    parent: XmlElement,
    tag: string,
    attrib: Record<string, string> | Map<string, string> = {},
): XmlElement => {
    const child = xmlElement(tag, attrib);
    parent.children.push(child);

    return child;
};

const DEFAULT_NAMESPACE_MAP: [string, string][] = [
    ['http://www.w3.org/XML/1998/namespace', 'xml'],
    ['http://www.w3.org/1999/xhtml', 'html'],
    ['http://www.w3.org/1999/02/22-rdf-syntax-ns#', 'rdf'],
    ['http://schemas.xmlsoap.org/wsdl/', 'wsdl'],
    ['http://www.w3.org/2001/XMLSchema', 'xs'],
    ['http://www.w3.org/2001/XMLSchema-instance', 'xsi'],
    ['http://purl.org/dc/elements/1.1/', 'dc'],
];
const namespaceMap = new Map<string, string>(DEFAULT_NAMESPACE_MAP);

/** ET.register_namespace(prefix, uri) (process-global, as in Python). */
export const xmlRegisterNamespace = (prefix: string, uri: string): void => {
    if (/^ns\d+$/.test(prefix))
        throw new Error('ValueError: Prefix format reserved for internal use');
    for (const [key, value] of [...namespaceMap.entries()]) {
        if (value === prefix) namespaceMap.delete(key);
    }
    namespaceMap.set(uri, prefix);
};

/** Element.iter(tag=None): pre-order, including the element itself. */
export function* xmlIter(element: XmlElement, tag?: string): Generator<XmlElement> {
    if (tag === undefined || tag === '*' || element.tag === tag) yield element;
    for (const child of element.children) yield* xmlIter(child, tag);
}

/** ET.indent(tree, space, level) */
export const xmlIndent = (tree: XmlElement, space = '  ', level = 0): void => {
    if (level < 0)
        throw new Error(`ValueError: Initial indentation level must be >= 0, got ${level}`);
    if (!tree.children.length) return;
    const indentations = ['\n' + space.repeat(level)];
    const indentChildren = (element: XmlElement, currentLevel: number) => {
        const childLevel = currentLevel + 1;
        let childIndentation = indentations[childLevel];
        if (childIndentation === undefined) {
            childIndentation = indentations[currentLevel] + space;
            indentations.push(childIndentation);
        }
        if (!element.text || !pyStrip(element.text)) element.text = childIndentation;
        let last: XmlElement | undefined;
        for (const child of element.children) {
            if (child.children.length) indentChildren(child, childLevel);
            if (!child.tail || !pyStrip(child.tail)) child.tail = childIndentation;
            last = child;
        }
        if (last && !pyStrip(last.tail ?? '')) last.tail = indentations[currentLevel];
    };
    indentChildren(tree, 0);
};

const escapeCdata = (text: string): string =>
    text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

const escapeAttrib = (text: string): string =>
    text
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll('\r', '&#13;')
        .replaceAll('\n', '&#10;')
        .replaceAll('\t', '&#09;');

const assertXmlString = (value: unknown): string => {
    if (typeof value !== 'string')
        throw new TypeError(`cannot serialize ${pyRepr(value)} (type ${typeName(value)})`);

    return value;
};

/**
 * ET.tostring / ElementTree.write output for method='xml': registered and generated (ns0...) namespace
 * prefixes, xmlns declarations on the root sorted by prefix, attributes in insertion order, short empty
 * elements as `<tag />`. With xmlDeclaration the `<?xml version='1.0' encoding='...'?>` line is prepended.
 * Characters the UTF-8 file writer cannot encode (lone surrogates) become &#N; (xmlcharrefreplace).
 */
export const xmlToString = (
    root: XmlElement,
    options: { xmlDeclaration?: boolean; encoding?: string; shortEmptyElements?: boolean } = {},
): string => {
    const qnames = new Map<string, string>();
    const namespaces = new Map<string, string>();
    const addQname = (qname: string) => {
        if (qname.startsWith('{')) {
            const close = qname.lastIndexOf('}');
            const uri = qname.slice(1, close);
            const tag = qname.slice(close + 1);
            let prefix = namespaces.get(uri);
            if (prefix === undefined) {
                prefix = namespaceMap.get(uri);
                if (prefix === undefined) prefix = 'ns' + namespaces.size;
                if (prefix !== 'xml') namespaces.set(uri, prefix);
            }
            qnames.set(qname, prefix ? `${prefix}:${tag}` : tag);
        } else {
            qnames.set(qname, qname);
        }
    };
    for (const element of xmlIter(root)) {
        assertXmlString(element.tag);
        if (!qnames.has(element.tag)) addQname(element.tag);
        for (const key of element.attrib.keys()) if (!qnames.has(key)) addQname(key);
    }
    const shortEmpty = options.shortEmptyElements ?? true;
    const out: string[] = [];
    if (options.xmlDeclaration)
        out.push(`<?xml version='1.0' encoding='${options.encoding ?? 'utf-8'}'?>\n`);
    const serialize = (element: XmlElement, declare: boolean) => {
        const tag = qnames.get(element.tag) as string;
        out.push('<' + tag);
        if (declare) {
            const sorted = [...namespaces.entries()].sort((a, b) => pyCompareStrings(a[1], b[1]));
            for (const [uri, prefix] of sorted)
                out.push(` xmlns${prefix ? ':' + prefix : ''}="${escapeAttrib(uri)}"`);
        }
        for (const [key, value] of element.attrib)
            out.push(` ${qnames.get(key)}="${escapeAttrib(assertXmlString(value))}"`);
        if (element.text || element.children.length || !shortEmpty) {
            out.push('>');
            if (element.text) out.push(escapeCdata(assertXmlString(element.text)));
            for (const child of element.children) serialize(child, false);
            out.push('</' + tag + '>');
        } else {
            out.push(' />');
        }
        if (element.tail) out.push(escapeCdata(assertXmlString(element.tail)));
    };
    serialize(root, true);

    return out
        .join('')
        .replace(new RegExp(LONE_SURROGATE.source, 'g'), unit => `&#${unit.charCodeAt(0)};`);
};

/** ET.ElementTree(root).write(path, encoding='utf-8', xml_declaration=True) */
export const xmlWrite = (path: string, root: XmlElement): void =>
    fs.writeFileSync(
        path,
        Buffer.from(xmlToString(root, { xmlDeclaration: true, encoding: 'utf-8' }), 'utf8'),
    );

const XML_ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

/** XML 1.0 Char production; expat rejects anything else, raw or as a character reference. */
const isXmlChar = (code: number): boolean =>
    code === 0x9 ||
    code === 0xa ||
    code === 0xd ||
    (code >= 0x20 && code <= 0xd7ff) ||
    (code >= 0xe000 && code <= 0xfffd) ||
    (code >= 0x10000 && code <= 0x10ffff);
const NON_XML_CHAR = /[^\t\n\r\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/u;

const decodeXmlReferences = (text: string, at: string): string =>
    text.replace(
        /&(#x[0-9a-fA-F]+|#[0-9]+|[A-Za-z_][\w.-]*);|&/g,
        (whole, ref: string | undefined) => {
            if (ref === undefined)
                throw new Error(`ParseError: not well-formed (invalid token) in ${at}`);
            if (ref.startsWith('#')) {
                const code = ref.startsWith('#x')
                    ? Number.parseInt(ref.slice(2), 16)
                    : Number.parseInt(ref.slice(1), 10);
                if (!isXmlChar(code))
                    throw new Error(`ParseError: reference to invalid character number in ${at}`);

                return String.fromCodePoint(code);
            }
            const entity = XML_ENTITIES[ref];
            if (entity === undefined) throw new Error(`ParseError: undefined entity &${ref};`);

            return entity;
        },
    );

/**
 * ET.parse / ET.fromstring for plain documents (no DTD): namespace-expanded `{uri}local` tags and
 * attribute names, text/tail split like ElementTree, XML line-end and attribute-value normalization.
 */
export const xmlParse = (source: string): XmlElement => {
    const invalid = NON_XML_CHAR.exec(source);
    if (invalid)
        throw new Error(`ParseError: not well-formed (invalid token) at offset ${invalid.index}`);
    const text = source.replace(/\r\n?/g, '\n');
    let pos = 0;
    const fail = (message: string): never => {
        throw new Error(`ParseError: ${message} at offset ${pos}`);
    };
    const skipMisc = () => {
        for (;;) {
            while (pos < text.length && /[ \t\n]/.test(text[pos])) pos++;
            if (text.startsWith('<?', pos)) {
                const end = text.indexOf('?>', pos);
                if (end < 0) fail('unclosed processing instruction');
                pos = end + 2;
            } else if (text.startsWith('<!--', pos)) {
                const end = text.indexOf('-->', pos);
                if (end < 0) fail('unclosed comment');
                pos = end + 3;
            } else if (text.startsWith('<!DOCTYPE', pos)) fail('DOCTYPE is not supported');
            else return;
        }
    };
    type Scope = Map<string, string>;
    const expand = (name: string, scope: Scope, isAttribute: boolean): string => {
        const colon = name.indexOf(':');
        if (colon < 0) {
            if (isAttribute) return name;
            const uri = scope.get('');

            return uri ? `{${uri}}${name}` : name;
        }
        const prefix = name.slice(0, colon);
        if (prefix === 'xml')
            return `{http://www.w3.org/XML/1998/namespace}${name.slice(colon + 1)}`;
        const uri = scope.get(prefix);
        if (uri === undefined) fail(`unbound prefix ${prefix}`);

        return `{${uri}}${name.slice(colon + 1)}`;
    };
    const NAME = /[^\s/>=]+/y;
    const parseElement = (parentScope: Scope): XmlElement => {
        pos++; // <
        NAME.lastIndex = pos;
        const nameMatch = NAME.exec(text);
        if (!nameMatch) return fail('not well-formed (invalid token)');
        const rawName = nameMatch[0];
        pos += rawName.length;
        const rawAttributes: [string, string][] = [];
        let selfClosing = false;
        for (;;) {
            while (/[ \t\n]/.test(text[pos] ?? '')) pos++;
            if (text.startsWith('/>', pos)) {
                pos += 2;
                selfClosing = true;
                break;
            }
            if (text[pos] === '>') {
                pos++;
                break;
            }
            NAME.lastIndex = pos;
            const attribute = NAME.exec(text);
            if (!attribute) return fail('not well-formed (invalid token)');
            pos += attribute[0].length;
            while (/[ \t\n]/.test(text[pos] ?? '')) pos++;
            if (text[pos] !== '=') fail('not well-formed (invalid token)');
            pos++;
            while (/[ \t\n]/.test(text[pos] ?? '')) pos++;
            const quote = text[pos];
            if (quote !== '"' && quote !== "'") return fail('not well-formed (invalid token)');
            const end = text.indexOf(quote, pos + 1);
            if (end < 0) fail('unclosed attribute');
            const rawValue = text.slice(pos + 1, end);
            if (rawValue.includes('<')) fail('not well-formed (invalid token)');
            pos = end + 1;
            rawAttributes.push([
                attribute[0],
                decodeXmlReferences(rawValue.replace(/[\t\n]/g, ' '), 'attribute'),
            ]);
        }
        const scope: Scope = new Map(parentScope);
        for (const [name, value] of rawAttributes) {
            if (name === 'xmlns') scope.set('', value);
            else if (name.startsWith('xmlns:')) scope.set(name.slice(6), value);
        }
        const element = xmlElement(expand(rawName, scope, false));
        for (const [name, value] of rawAttributes) {
            if (name === 'xmlns' || name.startsWith('xmlns:')) continue;
            const key = expand(name, scope, true);
            if (element.attrib.has(key)) fail('duplicate attribute');
            element.attrib.set(key, value);
        }
        if (selfClosing) return element;
        let buffer = '';
        const flush = () => {
            if (!buffer) return;
            const last = element.children[element.children.length - 1];
            if (last) last.tail = (last.tail ?? '') + buffer;
            else element.text = (element.text ?? '') + buffer;
            buffer = '';
        };
        for (;;) {
            if (pos >= text.length) fail('no element found');
            if (text.startsWith('</', pos)) {
                const end = text.indexOf('>', pos);
                const closing = text.slice(pos + 2, end).trim();
                if (closing !== rawName) fail('mismatched tag');
                pos = end + 1;
                flush();

                return element;
            }
            if (text.startsWith('<!--', pos)) {
                const end = text.indexOf('-->', pos);
                if (end < 0) fail('unclosed comment');
                pos = end + 3;
            } else if (text.startsWith('<![CDATA[', pos)) {
                const end = text.indexOf(']]>', pos);
                if (end < 0) fail('unclosed CDATA section');
                buffer += text.slice(pos + 9, end);
                pos = end + 3;
            } else if (text.startsWith('<?', pos)) {
                const end = text.indexOf('?>', pos);
                if (end < 0) fail('unclosed processing instruction');
                pos = end + 2;
            } else if (text[pos] === '<') {
                flush();
                element.children.push(parseElement(scope));
            } else {
                let end = text.indexOf('<', pos);
                if (end < 0) end = text.length;
                buffer += decodeXmlReferences(text.slice(pos, end), 'text');
                pos = end;
            }
        }
    };
    skipMisc();
    if (text[pos] !== '<') fail('syntax error');
    const root = parseElement(new Map());
    skipMisc();
    if (pos < text.length) fail('junk after document element');

    return root;
};

/**
 * Element.findall(path) for the forms used here: 'tag' (direct children) and './/tag' (all descendants),
 * with optional `prefix:` names resolved through namespaces.
 */
export const xmlFindAll = (
    element: XmlElement,
    path: string,
    namespaces: Record<string, string> = {},
): XmlElement[] => {
    const qualify = (name: string) => {
        const colon = name.indexOf(':');
        if (colon < 0) return name;
        const uri = namespaces[name.slice(0, colon)];
        if (uri === undefined)
            throw new Error(
                `SyntaxError: prefix ${pyRepr(name.slice(0, colon))} not found in prefix map`,
            );

        return `{${uri}}${name.slice(colon + 1)}`;
    };
    if (path.startsWith('.//')) {
        const tag = qualify(path.slice(3));

        return [...xmlIter(element)].filter(
            node => node !== element && (tag === '*' || node.tag === tag),
        );
    }
    const tag = qualify(path);

    return element.children.filter(child => tag === '*' || child.tag === tag);
};
