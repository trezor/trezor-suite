// Tiny helper for throwing errors from expressions
export const throwError = (reason: string | Error) => {
    throw reason instanceof Error ? reason : new Error(reason);
};
