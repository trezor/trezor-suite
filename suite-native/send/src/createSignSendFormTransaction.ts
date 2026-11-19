import { type DispatchDep } from '@trezor/redux-utils';

import { signTransactionNativeThunk } from './sendFormThunks';

export type SignSendFormTransactionDeps = DispatchDep;

type SignSendFormTransactionParams = Parameters<typeof signTransactionNativeThunk>[0];

type SignSendFormTransactionResult = Awaited<
    ReturnType<ReturnType<typeof signTransactionNativeThunk>>
>;

export type SignSendFormTransaction = (
    params: SignSendFormTransactionParams,
) => Promise<SignSendFormTransactionResult>;

export type SignSendFormTransactionDep = {
    signSendFormTransaction: SignSendFormTransaction;
};

export const createSignSendFormTransaction =
    (deps: SignSendFormTransactionDeps): SignSendFormTransaction =>
    params =>
        deps.dispatch(signTransactionNativeThunk(params));

export const injectSignSendFormTransaction = (
    services: SignSendFormTransactionDep,
): SignSendFormTransactionDep => ({
    signSendFormTransaction: services.signSendFormTransaction,
});
