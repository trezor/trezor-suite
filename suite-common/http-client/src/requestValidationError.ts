import type { StandardSchemaV1 } from 'up-fetch';

export type RequestValidationTarget = 'body' | 'params' | 'routeParams';

export class RequestValidationError extends Error {
    readonly issues: readonly StandardSchemaV1.Issue[];
    readonly target: RequestValidationTarget;

    constructor(target: RequestValidationTarget, result: StandardSchemaV1.FailureResult) {
        super(`Request ${target} validation failed`);

        this.name = 'RequestValidationError';
        this.issues = result.issues;
        this.target = target;
    }
}

export const isRequestValidationError = (error: unknown): error is RequestValidationError =>
    error instanceof RequestValidationError;
