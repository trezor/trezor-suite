export type MergeFunction = (...args: unknown[]) => unknown;

export type Primitive =
    | string
    | number
    | boolean
    | bigint
    | symbol
    | Date
    | MergeFunction
    | null
    | undefined;

type IsOptionalKey<T extends object, K extends keyof T> =
    T extends Record<K, T[K]> ? false : {} extends Pick<T, K> ? true : false;

export type OptionalKeys<T extends object> = {
    [K in keyof T]-?: IsOptionalKey<T, K> extends true ? K : never;
}[keyof T];

export type RequiredKeys<T extends object> = Exclude<keyof T, OptionalKeys<T>>;

export type NormalizedValue<T extends object, K extends PropertyKey> = K extends keyof T
    ? K extends OptionalKeys<T>
        ? Exclude<T[K], undefined>
        : T[K]
    : never;

export type Simplify<T> = { [K in keyof T]: T[K] };

export type ObjectMap = Record<string, unknown>;

export const isObject = (obj: unknown): obj is ObjectMap => {
    if (typeof obj === 'object' && obj !== null) {
        if (typeof Object.getPrototypeOf === 'function') {
            const prototype = Object.getPrototypeOf(obj);

            return prototype === Object.prototype || prototype === null;
        }

        return Object.prototype.toString.call(obj) === '[object Object]';
    }

    return false;
};
