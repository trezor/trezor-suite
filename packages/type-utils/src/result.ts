/**
 * This is copy-cat of Evolu Result type.
 * @see https://www.evolu.dev/docs/api-reference/common/Result/type-aliases/Result
 */

export interface Ok<out T> {
    readonly success: true;
    readonly payload: T;
}

export interface Err<out E> {
    readonly success: false;
    readonly error: E;
}

export type Result<T, E = never> = Ok<T> | Err<E>;

export type InferOk<R extends Result<any, any>> = R extends Ok<infer T> ? T : never;
export type InferErr<R extends Result<any, any>> = R extends Err<infer E> ? E : never;

export function ok(): Result<void>;
export function ok<T>(payload: T): Result<T>;
export function ok<T>(payload?: T): Result<T> {
    return { success: true, payload: payload as T };
}

export const err = <E>(error: E): Result<never, E> => ({ success: false, error });
