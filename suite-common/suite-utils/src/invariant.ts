export class InvariantError extends Error {
    constructor(message: string = 'Invariant Violation') {
        super(message);
    }
}

export function invariant<T>(condition: T, message?: string): asserts condition {
    if (!condition) {
        throw new InvariantError(message);
    }
}
