/**
 * This is copy-cat of Evolu Result type.
 * @see https://www.evolu.dev/docs/api-reference/common/Result/type-aliases/Result
 */
export type OK<S> = {
    ok: true;
    value: S;
};

/**
 * This is copy-cat of Evolu Result type.
 * @see https://www.evolu.dev/docs/api-reference/common/Result/type-aliases/Result
 */
export type Err<E> = {
    ok: false;
    error: E;
};

/**
 * This is copy-cat of Evolu Result type.
 * @see https://www.evolu.dev/docs/api-reference/common/Result/type-aliases/Result
 */
export type Result<S, E> = OK<S> | Err<E>;

export const ok = <S>(value: S): OK<S> => ({ ok: true, value });
export const err = <E>(error: E): Err<E> => ({ ok: false, error });
