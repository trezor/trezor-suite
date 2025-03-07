export class InvariantError extends Error {
    constructor(message: string = 'Invariant Violation') {
        super(message);
    }
}

/**
 * Narrows type and throws an error if the condition is falsy.
 * DO NOT put any sensitive data in the message! (as they might be propagated to sentry)
 */
export function invariant<T>(condition: T, message?: string): asserts condition {
    if (!condition) {
        throw new InvariantError(message);
    }
}
