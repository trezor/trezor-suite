class UnreachableCaseError extends Error {
    constructor(val: never, message: string) {
        super(`${message}: [${JSON.stringify(val)}]`);
    }
}

export const exhaustive = (unhandledCase: never, message = 'Unreachable case'): never => {
    throw new UnreachableCaseError(unhandledCase, message);
};
