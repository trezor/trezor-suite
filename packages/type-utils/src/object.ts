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
