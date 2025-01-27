export class UnreachableCaseError extends Error {
    constructor(val: never, message = 'Unreachable case') {
        super(`${message}: [${JSON.stringify(val)}]`);
    }
}
