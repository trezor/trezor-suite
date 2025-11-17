/**
 * This is copy-cat of Evolu Result type.
 * @see https://www.evolu.dev/docs/api-reference/common/Result/type-aliases/Result
 */

export type Result<T, E> = Ok<T> | Err<E>;

export interface Ok<T> {
    readonly ok: true;
    readonly value: T;
}

export interface Err<E> {
    readonly ok: false;
    readonly error: E;
}

export type InferOk<R extends Result<any, any>> = R extends Ok<infer T> ? T : never;
export type InferErr<R extends Result<any, any>> = R extends Err<infer E> ? E : never;

export function ok(): Ok<void>;
export function ok<T>(value: T): Ok<T>;
export function ok<T>(value = undefined): Ok<T> {
    return { ok: true, value: value as T };
}

export const err = <E>(error: E): Err<E> => ({ ok: false, error });
