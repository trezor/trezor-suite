import { type SignTransactionError } from '@suite-common/wallet-core';

import { type TradingSignAndPushError } from '../types';

type RejectedSignAndPushStep<TError extends TradingSignAndPushError> = {
    payload?: TError;
    error: { message?: string };
};

export const getSignAndPushRejectionError = <TError extends TradingSignAndPushError>({
    payload,
    error,
}: RejectedSignAndPushStep<TError>): TError | SignTransactionError =>
    payload ?? { error: 'sign-transaction-failed', message: error.message };
