/**
 * Pick a subset U of a union type T.
 *
 * Example:
 *  ```
 *  type T = 'a' | 'b' | 'c';
 *  type U = UnionSubset<T, 'a' | 'c'>; // 'a' | 'c'
 *  ```
 */
/**
 * Convert a union type to an intersection type.
 *
 * Example:
 *  ```
 *  type T = UnionToIntersection<A | B>; // A & B
 *  ```
 */
export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
    k: infer I,
) => void
    ? I
    : never;

export type UnionSubset<T, U extends T> = U;

/**
 * Make property of the object required.
 *
 * Example:
 *  ```
 *  type T = { a?: number };
 *  const t: RequiredKey<T, 'a'> = { a: 0 }; // 'a' is mandatory
 *  ```
 */
export type RequiredKey<M, K extends keyof M> = Omit<M, K> & Required<Pick<M, K>>;

/**
 * Make property of the object optional.
 *
 * Example:
 *  ```
 *  type T = { a: number; b: number; };
 *  const t: OptionalKey<T, 'a'> = { b: 0 }; // 'a' is optional
 *  ```
 */
export type OptionalKey<M, K extends keyof M> = Omit<M, K> & Partial<Pick<M, K>>;

/**
 * Get type of the object values.
 *
 * Example:
 *  ```
 *  type T = { a: number; b: string };
 *  type V: ObjectValues<T>; // number | string
 *  ```
 */
export type ObjectValues<T extends { [key: string]: any }> = T[keyof T];

/**
 * Distributes the Omit across a union. using distributive conditional types to achieve this:
 * @see: https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#distributive-conditional-types
 * @source: https://stackoverflow.com/questions/57103834/typescript-omit-a-property-from-all-interfaces-in-a-union-but-keep-the-union-s#answer-57103940
 *
 * Example:
 *  ```
 *  type T = { remove: string; keep1: number } | { remove: string; keep2: boolean };
 *  type W = Without<T, 'remove'>;
 *  const w: W = { keep1: 1, keep2: true };
 *  ```
 */
export type Without<T, K extends keyof T> = T extends any ? Omit<T, K> : never;

/**
 * Const with optional types.
 * Todo: add example and better explanation.
 *       It has exactly 1 usage so maybe this shall even be here in the utils package
 */
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

/**
 * Recursively makes all properties of the object optional. If the nested property is an object,
 * it will make its properties optional as well.
 *
 * Example:
 *  ```
 *  type T = { a: number; b: { c: string; d: number } };
 *  type P = DeepPartial<T>;
 *  const p: P = { b: { d: 1 } }; // As everything is deeply optional
 *  ```
 */
export type DeepPartial<T> = T extends () => any
    ? T
    : T extends { [key: string]: any }
      ? { [P in keyof T]?: DeepPartial<T[P]> }
      : T;

/**
 * Type containing all primitive types in TypeScript.
 */
export type PrimitiveType = string | number | boolean | Date | null | undefined;

/**
 * Record<K, T> with optional key and required value.
 *
 * Example:
 *  ```
 *  const p: PartialRecord<'a' | 'b' | 'c', string>; = { b: 'value' };
 *  ```
 */
export type PartialRecord<K extends PropertyKey, T> = { [P in K]?: T };

/**
 * This infers the union literal type from ReturnType but exclude undefined
 */
export type DefinedUnionMember<T> = T extends string ? T : never;

/**
 * Map object `T` to a narrowed type with only those entries that match given `ValueFilter` type
 */
export type FilterPropertiesByType<T, ValueFilter> = {
    [Key in keyof T as T[Key] extends ValueFilter ? Key : never]: T[Key];
};

export type XORWithout<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

/**
 * XOR type - allows only one of the two types, not both
 * @example
 * type LoginMethod = XOR<{ email: string }, { phone: string }>;
 * Valid: { email: 'test@example.com' }
 * Valid: { phone: '+1234567890' }
 * Invalid: { email: 'test@example.com', phone: '+1234567890' }
 */
export type XOR<T, U> = T | U extends object
    ? (XORWithout<T, U> & U) | (XORWithout<U, T> & T)
    : T | U;

/**
 * Removed the type from the union where `{ KeyName: ValueToExclude }`.
 *
 * Example:
 *  ```
 *  type T1 =
 *     | { type: 'A'; a: string }
 *     | { type: 'B'; b: number }
 *     | { type: 'C' | 'D' | 'E'; cde: boolean };
 *
 *  // { type: 'A', a: string } | { type: 'B', b: number } | { type: 'D' | 'E', cde: boolean };
 *  type NotC = FilterOutFromUnionByTypeProperty<T1, 'type', 'C'>;
 *  ```
 */
export type FilterOutFromUnionByTypeProperty<
    Union,
    KeyName extends keyof Union,
    ValueToExclude extends Union[KeyName],
> = Union extends { [K in KeyName]: infer ActualValue }
    ? ActualValue extends ValueToExclude
        ? never
        : { [K in KeyName]: Exclude<ActualValue, ValueToExclude> } & Omit<Union, KeyName>
    : Union;
