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

/**
 * Requires at least one of the given keys of `T` to be present.
 * If `K` is omitted, at least one of all keys of `T` is required.
 *
 * Example:
 *  ```
 *  type T = RequireAtLeastOne<{ a?: number; b?: string; c?: boolean }>;
 *  const t1: T = { a: 1 };        // ok
 *  const t2: T = { b: 'x', c: true }; // ok
 *  const t3: T = {};              // error
 *  ```
 */
export type RequireAtLeastOne<T, K extends keyof T = keyof T> = {
    [P in K]-?: Pick<T, P> & Partial<Omit<T, P>>;
}[K] &
    Omit<T, K>;

export type NarrowObjectWithKey<T, K extends PropertyKey> = T extends any
    ? K extends keyof T
        ? T
        : never
    : never;

export type NullablePropsRecursive<T extends Record<string, any>> = {
    [K in keyof T]: T[K] extends (...args: any[]) => any
        ? T[K] | null
        : T[K] extends Record<string, any>
          ? NullablePropsRecursive<T[K]> | null
          : T[K] | null;
};
