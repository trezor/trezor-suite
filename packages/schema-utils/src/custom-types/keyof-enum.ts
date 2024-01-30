import { JavaScriptTypeBuilder, TUnion, Hint, SchemaOptions, TLiteral } from '@sinclair/typebox';

// UnionToIntersection<A | B> = A & B
type UnionToIntersection<U> = (U extends unknown ? (arg: U) => 0 : never) extends (
    arg: infer I,
) => 0
    ? I
    : never;

// LastInUnion<A | B> = B
type LastInUnion<U> =
    UnionToIntersection<U extends unknown ? (x: U) => 0 : never> extends (x: infer L) => 0
        ? L
        : never;

// Build a tuple for the object
// Strategy - take the last key, add it to the tuple, and recurse on the rest
// Wrap the key in a TLiteral for Typebox
type ObjectKeysToTuple<T, Last = LastInUnion<keyof T>> = [T] extends [never]
    ? []
    : [Last] extends [never]
      ? []
      : Last extends string | number
        ? [...ObjectKeysToTuple<Omit<T, Last>>, TLiteral<Last>]
        : [];

export interface TKeyOfEnum<T extends Record<string, string | number>>
    extends TUnion<ObjectKeysToTuple<T>> {
    [Hint]: 'KeyOfEnum';
}

export class KeyofEnumBuilder extends JavaScriptTypeBuilder {
    KeyOfEnum<T extends Record<string, string | number>>(
        schema: T,
        options?: SchemaOptions,
    ): TKeyOfEnum<T> {
        const keys = Object.keys(schema).map(key => this.Literal(key));
        return this.Union(keys, { ...options, [Hint]: 'KeyOfEnum' }) as TKeyOfEnum<T>;
    }
}
