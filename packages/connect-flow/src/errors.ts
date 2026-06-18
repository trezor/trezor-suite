/**
 * Normalize anything thrown (in a catch block, a rejected promise, etc.) into a
 * proper Error, so consumers don't have to repeat the `instanceof Error` dance.
 */
export const normalizeError = (error: unknown): Error => {
    if (error instanceof Error) return error;
    if (typeof error === 'string') return new Error(error);

    return new Error(String(error));
};
