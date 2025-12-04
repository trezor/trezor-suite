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

/**
 * All keys of types in a union.
 *
 * Example:
 *  ```
 *  type T = { a: number; b: string } & ({ foo: numer } | { bar: string });
 *  type K: KeysOfUnion<T>; // 'a' | 'b' | 'foo' | 'bar'
 *  ```
 */
export type KeysOfUnion<T> = T extends T ? keyof T : never;

export type NarrowObjectWithKey<T, K extends PropertyKey> = T extends any
    ? K extends keyof T
        ? T
        : never
    : never;
