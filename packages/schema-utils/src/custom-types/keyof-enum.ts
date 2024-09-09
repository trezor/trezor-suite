import {
    JavaScriptTypeBuilder,
    TUnion,
    Hint,
    SchemaOptions,
    TLiteral,
    TEnum,
    TEnumKey,
    TEnumValue,
} from '@sinclair/typebox';

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

// TLiteral<"a" | "b"> => TLiteral<"a"> | TLiteral<"b">
type DistributeLiterals<T extends string | number | symbol> = T extends T
    ? T extends string | number
        ? TLiteral<T>
        : never
    : never;

// TLiteral<"A"> | TLiteral<"B"> => [TLiteral<"A">, TLiteral<"B".]
type UnionToTuple<U extends TLiteral, Last = LastInUnion<U>> = [U] extends [never]
    ? []
    : [...UnionToTuple<Exclude<U, Last>>, Last];

// Explicitly make sure every element is a TLiteral
type TLiteralGuard<T extends unknown[]> = {
    [K in keyof T]: T[K] extends TLiteral<string | number> ? T[K] : never;
};

export interface TKeyOfEnum<T extends Record<string, string | number>>
    extends TUnion<TLiteralGuard<UnionToTuple<DistributeLiterals<keyof T>>>> {
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

    Enum<V extends TEnumValue, T extends Record<TEnumKey, V>>(
        schema: T,
        options?: SchemaOptions,
    ): TEnum<T> {
        const anyOf = Object.entries(schema)
            .filter(([key, _value]) => typeof key === 'string' || !isNaN(key))
            .map(([key, value]) => this.Literal(value, { $id: key }));

        return this.Union(anyOf, { ...options, [Hint]: 'Enum' }) as TEnum<T>;
    }
}
