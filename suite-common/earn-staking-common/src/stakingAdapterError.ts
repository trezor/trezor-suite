export class StakingAdapterError extends Error {
    readonly code: string;

    constructor(code: string) {
        super(code);
        this.name = 'StakingAdapterError';
        this.code = code;
    }
}

export const isStakingAdapterError = (error: unknown): error is StakingAdapterError =>
    error instanceof StakingAdapterError;
