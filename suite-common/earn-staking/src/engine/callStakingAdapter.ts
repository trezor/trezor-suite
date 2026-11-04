import { isStakingAdapterError } from '@suite-common/earn-staking-common';

export type StakingAdapterCallResult<T> =
    { success: true; payload: T } | { success: false; code: string | null; error: unknown };

export const callStakingAdapter = async <T>(
    call: () => Promise<T>,
): Promise<StakingAdapterCallResult<T>> => {
    try {
        const payload = await call();

        return { success: true, payload };
    } catch (error) {
        const code = isStakingAdapterError(error) ? error.code : null;

        return { success: false, code, error };
    }
};

// Only the adapter's code or the error's name is logged: a Connect rejection message can embed the
// composed account payload.
export const warnStakingAdapterFailure = (
    subject: string,
    failure: Extract<StakingAdapterCallResult<unknown>, { success: false }>,
) => {
    const reason =
        failure.code ?? (failure.error instanceof Error ? failure.error.name : 'unknown error');

    console.warn(`Staking ${subject} failed: ${reason}`);
};
