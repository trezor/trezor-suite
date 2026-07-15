/* eslint-disable no-restricted-syntax -- this file *is* the typed Object.keys/entries/values
   wrappers, so the very casts the rule warns about live here on purpose — the whole point is
   that nobody else has to write them. */
import { type KeysOfUnion, type NarrowObjectWithKey } from '@trezor/type-utils';

/** Typed wrapper around `Object.entries()` that preserves key and value types. */
export const typedObjectEntries = <T extends Record<string, unknown>>(
    obj: T,
): [keyof T, T[keyof T]][] => Object.entries(obj) as [keyof T, T[keyof T]][];

type TypedObjectFromEntries<T extends readonly (readonly [PropertyKey, unknown])[]> = {
    [Entry in T[number] as Entry[0]]: Entry[1];
};

/** Typed wrapper around `Object.fromEntries()` that keeps key literals (if the input entries keep them too). */
export const typedObjectFromEntries = <
    const T extends readonly (readonly [PropertyKey, unknown])[],
>(
    entries: T,
): TypedObjectFromEntries<T> => Object.fromEntries(entries) as TypedObjectFromEntries<T>;

/** Maps object values while preserving the original object keys in the result type. */
export const typedObjectTransformValues = <T extends Record<string, unknown>, U>(
    obj: T,
    transform: (value: T[keyof T], key: keyof T) => U,
): { [K in keyof T]: U } =>
    Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [key, transform(value as T[keyof T], key)]),
    ) as { [K in keyof T]: U };

/** Typed wrapper around `Object.keys()` that preserves `keyof T`. */
export const typedObjectKeys = <T extends Record<string, unknown>>(obj: T): Array<keyof T> =>
    Object.keys(obj);

/** Typed wrapper around `Object.values()` that preserves the union of object value types. */
export const typedObjectValues = <T extends Record<string, unknown>>(obj: T): Array<T[keyof T]> =>
    Object.values(obj) as Array<T[keyof T]>;

/**
 * Type guard for checking whether an object owns a property from a union of possible keys.
 *
 * @example
 * ```ts
 * type Props = { a: number; b: string } & ({ foo: number } | { bar: string });
 *
 * function someFn(props: Props) {
 *    return hasOwn(props, 'foo') ? props.foo : props.bar;
 * }
 * ```
 */
export function hasOwn<T extends object, K extends KeysOfUnion<T>>(
    obj: T,
    key: K,
): obj is NarrowObjectWithKey<T, K> {
    return Object.hasOwn(obj, key);
}

/** Type guard for checking whether an unknown value contains the given property. */
export function hasProp<K extends PropertyKey>(obj: unknown, prop: K): obj is Record<K, unknown> {
    return typeof obj === 'object' && obj !== null && prop in obj;
}
