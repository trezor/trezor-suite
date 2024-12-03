// make key required

export type RequiredKey<M, K extends keyof M> = Omit<M, K> & Required<Pick<M, K>>;

// object values types
export type ObjectValues<T extends { [key: string]: any }> = T[keyof T];

// all keys of types in an union
export type Keys<T> = T extends any ? keyof T : never;

// remove the keys while keeping the union
export type Without<T, K extends keyof any> = T extends any ? Omit<T, K> : never;

// array element type
export type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType[number];

// const with optional types
export type ConstWithOptionalFields<
    Const extends { [key: string]: any },
    Fields extends string | number | symbol,
> = {
    [Key in keyof Const]: {
        [FieldKey in Fields]: Const[Key][FieldKey] extends
            | string
            | number
            | { [key: string]: any }
            | boolean
            ? Const[Key][FieldKey]
            : undefined;
    };
};

// Extract item from union
export type ItemExtractor<M> = Extract<M, { type: M }>;

// Unwrap type from Promise
export type Await<T> = T extends {
    then(onfulfilled?: (value: infer U) => unknown): unknown;
}
    ? U
    : T;

export type DeepPartial<T> = T extends () => any
    ? T
    : T extends { [key: string]: any }
      ? { [P in keyof T]?: DeepPartial<T[P]> }
      : T;

export type PrimitiveType = string | number | boolean | Date | null | undefined;

// Record<K, T> with optional key and required value.
// example of using partial union as keys:
// const p: PartialRecord<'a' | 'b' | 'c', string>; = { b: 'value' };
export type PartialRecord<K extends keyof any, T> = {
    [P in K]?: T;
};

// distributive conditional types to the rescue! This way we can infer union literal type from ReturnType but exclude undefined
export type DefinedUnionMember<T> = T extends string ? T : never;

export type GetObjectWithKey<U, K extends PropertyKey> = U extends object
    ? K extends keyof U
        ? U
        : never
    : never;
export type GetObjectWithoutKey<U, K extends PropertyKey> = U extends object
    ? K extends keyof U
        ? never
        : U
    : never;

export type ObjectsOnly<T> = T extends Record<string, unknown> ? T : never;

// map object `T` to a narrowed type with only those entries that match given `ValueFilter` type
export type FilterPropertiesByType<T, ValueFilter> = {
    [Key in keyof T as T[Key] extends ValueFilter ? Key : never]: T[Key];
};

