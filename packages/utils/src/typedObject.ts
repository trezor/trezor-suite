import { type KeysOfUnion, type NarrowObjectWithKey } from '@trezor/type-utils';

export const typedObjectEntries = <T extends Record<string, unknown>>(
    obj: T,
): [keyof T, T[keyof T]][] => Object.entries(obj) as [keyof T, T[keyof T]][];

export const typedObjectFromEntries = <T extends readonly (readonly [string, unknown])[]>(
    entries: T,
): { [K in T[number] as K[0]]: K[1] } =>
    Object.fromEntries(entries) as { [K in T[number] as K[0]]: K[1] };

export const typedObjectKeys = <T extends Record<string, unknown>>(obj: T): Array<keyof T> =>
    Object.keys(obj) as Array<keyof T>;

export const typedObjectValues = <T extends Record<string, unknown>>(obj: T): Array<T[keyof T]> =>
    Object.values(obj) as Array<T[keyof T]>;

/**
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

export function hasProp<K extends PropertyKey>(obj: unknown, prop: K): obj is Record<K, unknown> {
    return typeof obj === 'object' && obj !== null && prop in obj;
}
