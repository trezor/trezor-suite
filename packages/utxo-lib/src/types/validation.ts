// Runtime type validation utilities using @sinclair/typebox.
// Replaces the typeforce library.
// upstream: https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/ts_src/types.ts

import { Kind, type SchemaOptions, TSchema, Type, TypeRegistry } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import ecc from 'tiny-secp256k1';

// ---------------------------------------------------------------------------
// Custom typebox types
// ---------------------------------------------------------------------------

/** TBufferN – validates `value instanceof Buffer && value.length === n` */
interface TBufferN extends TSchema {
    [Kind]: 'BufferN';
    static: Buffer;
    type: 'BufferN';
    length: number;
}

TypeRegistry.Set<TBufferN>(
    'BufferN',
    (schema, value) => Buffer.isBuffer(value) && value.length === schema.length,
);

function BufferNSchema(length: number): TBufferN {
    return { [Kind]: 'BufferN', type: 'BufferN', length } as TBufferN;
}

/** TBufferAny – validates `value instanceof Buffer` (any length) */
interface TBufferAny extends TSchema {
    [Kind]: 'BufferAny';
    static: Buffer;
    type: 'BufferAny';
}

TypeRegistry.Set<TBufferAny>('BufferAny', (_schema, value) => Buffer.isBuffer(value));

const BufferSchema: TBufferAny = { [Kind]: 'BufferAny', type: 'BufferAny' } as TBufferAny;

/** THex – validates hex-encoded string */
interface THex extends TSchema {
    [Kind]: 'Hex';
    static: string;
    type: 'Hex';
}

TypeRegistry.Set<THex>(
    'Hex',
    (_schema, value) => typeof value === 'string' && /^([0-9a-f]{2})+$/i.test(value),
);

const HexSchema: THex = { [Kind]: 'Hex', type: 'Hex' } as THex;

// ---------------------------------------------------------------------------
// Integer schemas with range constraints
// ---------------------------------------------------------------------------

const UInt8 = Type.Integer({ minimum: 0, maximum: 0xff, title: 'UInt8' });
const UInt16 = Type.Integer({ minimum: 0, maximum: 0xffff, title: 'UInt16' });
const UInt32 = Type.Integer({ minimum: 0, maximum: 0xffffffff, title: 'UInt32' });
const UInt53 = Type.Integer({ minimum: 0, maximum: Number.MAX_SAFE_INTEGER, title: 'UInt53' });

// ---------------------------------------------------------------------------
// Domain-specific constants
// ---------------------------------------------------------------------------

const SATOSHI_MAX = 21 * 1e14;

/** TPredicate – validates a value using a custom predicate function */
interface TPredicate extends TSchema {
    [Kind]: 'Predicate';
    static: Buffer;
    type: 'Predicate';
    name: string;
    predicate: (value: unknown) => boolean;
}

TypeRegistry.Set<TPredicate>('Predicate', (schema, value) => schema.predicate(value));

function PredicateSchema(
    name: string,
    predicate: (value: unknown) => boolean,
    options?: SchemaOptions,
): TPredicate {
    return { [Kind]: 'Predicate', type: 'Predicate', name, predicate, ...options } as TPredicate;
}

const Buffer256bit = BufferNSchema(32);
const Hash160bitSchema = BufferNSchema(20);
const Hash256bitSchema = BufferNSchema(32);
const Point = PredicateSchema('Point', v => Buffer.isBuffer(v) && ecc.isPoint(v));

// ---------------------------------------------------------------------------
// Assertion & checking utilities
// ---------------------------------------------------------------------------

/** Format a value for use in error messages. Handles Buffers safely. */
function formatValue(value: unknown): string {
    if (Buffer.isBuffer(value)) return `Buffer(Length: ${value.length})`;
    if (typeof value === 'string') return `String "${value}"`;

    return String(value);
}

/** Format schema name for error messages, including relevant parameters. */
function formatSchemaName(schema: TSchema, brief = false): string {
    if ('title' in schema && typeof schema.title === 'string') return schema.title;
    const kind = schema[Kind] as string | undefined;
    const name = (schema as { type?: string }).type ?? kind ?? 'unknown';
    if (name === 'BufferN' && 'length' in schema && typeof schema.length === 'number')
        return brief ? 'Buffer' : `Buffer(Length: ${schema.length})`;
    if (name === 'BufferAny') return 'Buffer';
    if (name === 'Predicate' && 'name' in schema && typeof schema.name === 'string')
        return schema.name;
    if (kind === 'Union' && 'anyOf' in schema && Array.isArray(schema.anyOf)) {
        const parts = (schema.anyOf as TSchema[]).map(s => formatSchemaName(s, true));

        return `?${parts.join('|')}`;
    }

    return name;
}

/** Throws TypeError if `value` does not match `schema`. */
function assertType(schema: TSchema, value: unknown): void {
    if (!Value.Check(schema, value)) {
        const errors = [...Value.Errors(schema, value)];
        const first = errors[0];
        if (!first) throw new TypeError('Type check failed');
        const schemaName = formatSchemaName(first.schema);
        const val = formatValue(first.value);
        const prop = first.path.startsWith('/') ? first.path.slice(1) : first.path;
        const message = prop
            ? `Expected property "${prop}" of type ${schemaName}, got ${val}`
            : `Expected ${schemaName}, got ${val}`;
        throw new TypeError(message);
    }
}

/** Returns true if `value` matches `schema`. */
function checkType(schema: TSchema, value: unknown): boolean {
    return Value.Check(schema, value);
}

// Callable validators that also serve as schemas (backward compat with typeforce API).
// `types.Hash160bit(buf)` throws on invalid, `assertType(Hash160bit, buf)` also works.
function makeCallableSchema(schema: TBufferN): ((value: unknown) => void) & TBufferN {
    const fn = (value: unknown) => assertType(schema, value);
    Object.defineProperty(fn, Kind, { value: schema[Kind] });
    Object.defineProperty(fn, 'type', { value: schema.type });
    Object.defineProperty(fn, 'length', { value: schema.length });

    return fn as ((value: unknown) => void) & TBufferN;
}

const Hash160bit = makeCallableSchema(Hash160bitSchema);
const Hash256bit = makeCallableSchema(Hash256bitSchema);

/**
 * Equivalent to typeforce's `maybe(x)`: the property may be omitted, set to `null`,
 * or set to a value matching the schema.
 * Use this instead of `Type.Optional()` for fields that may be explicitly `null`.
 */
function Nullable<T extends TSchema>(schema: T) {
    return Type.Optional(Type.Union([schema, Type.Null()]));
}

// ---------------------------------------------------------------------------
// Predicate shorthands (used as `isBuffer(v)`, `isNumber(v)`, etc.)
// ---------------------------------------------------------------------------

function isBuffer(value: unknown): value is Buffer {
    return Buffer.isBuffer(value);
}

function isNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}

function isArray(value: unknown): value is unknown[] {
    return Array.isArray(value);
}

function isString(value: unknown): value is string {
    return typeof value === 'string';
}

function isHex(value: unknown): value is string {
    return typeof value === 'string' && /^([0-9a-f]{2})+$/i.test(value);
}

function isSatoshi(value: unknown): value is number {
    return (
        typeof value === 'number' &&
        Number.isSafeInteger(value) &&
        value >= 0 &&
        value <= SATOSHI_MAX
    );
}

// Backward-compatible callable validators (matching old typeforce API)
function Satoshi(value: number): boolean {
    return isSatoshi(value);
}

export {
    // Custom schema constructors & constants
    BufferNSchema,
    BufferSchema,
    HexSchema,
    Point,
    PredicateSchema,
    Buffer256bit,
    Hash160bit,
    Hash256bit,
    UInt8,
    UInt16,
    UInt32,
    UInt53,

    // Runtime assertion / check
    assertType,
    checkType,
    Nullable,

    // Predicate shorthands
    isBuffer,
    isNumber,
    isArray,
    isString,
    isHex,
    isSatoshi,
    Satoshi,

    // Re-export Type builder for inline schema construction
    Type,
    Value,
};

export type { TBufferN, TBufferAny, THex };
