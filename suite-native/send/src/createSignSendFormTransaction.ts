import { isRejected } from '@reduxjs/toolkit';

import { type TokenAddress } from '@suite-common/tokens';
import {
    type SignTransactionError,
    type SignTransactionTimeoutError,
    enhancePrecomposedTransactionThunk,
    selectAccountByKey,
    selectSendFormDraftByKey,
    signTransactionThunk,
} from '@suite-common/wallet-core';
import {
    type AccountKey,
    type FormState,
    type GeneralPrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import { type BlockbookTransaction } from '@trezor/blockchain-link-types';
import { type DispatchDep, type GetStateDep } from '@trezor/redux-utils';
import { type Result, err, ok } from '@trezor/type-utils';

export type SignSendFormTransactionDeps = DispatchDep & GetStateDep;

export type SignSendFormTransactionParams = {
    accountKey: AccountKey;
    feeLevel: GeneralPrecomposedTransactionFinal;
    tokenContract?: TokenAddress;
    // Overrides the account's send draft, for flows that sign a form state which was never
    // stored as a draft (e.g. a composed cancel transaction).
    formState?: FormState;
};

export type SignSendFormTransactionError = SignTransactionError | SignTransactionTimeoutError;

export type SignSendFormTransaction = (
    params: SignSendFormTransactionParams,
) => Promise<Result<BlockbookTransaction | undefined, SignSendFormTransactionError>>;

export type SignSendFormTransactionDep = {
    signSendFormTransaction: SignSendFormTransaction;
};

const signingFailed = (message: string): Result<never, SignTransactionError> =>
    err({ error: 'sign-transaction-failed', message });

export const createSignSendFormTransaction =
    (deps: SignSendFormTransactionDeps): SignSendFormTransaction =>
    async params => {
        const account = selectAccountByKey(deps.getState(), params.accountKey);
        const formState =
            params.formState ??
            selectSendFormDraftByKey(deps.getState(), params.accountKey, params.tokenContract);

        if (!account || !formState) return signingFailed('Account or form draft not found.');

        const enhanceResponse = await deps.dispatch(
            enhancePrecomposedTransactionThunk({
                transactionFormValues: formState,
                precomposedTransaction: params.feeLevel,
                selectedAccount: account,
            }),
        );

        if (isRejected(enhanceResponse)) {
            return signingFailed('Unable to precompose transaction for signing.');
        }

        const deviceAccessResponse = await requestPrioritizedDeviceAccess(() =>
            deps.dispatch(
                signTransactionThunk({
                    formState,
                    precomposedTransaction: enhanceResponse.payload,
                    selectedAccount: account,
                }),
            ),
        );

        if (!deviceAccessResponse.success) {
            return signingFailed('Prioritized device access failed.');
        }

        const signTransactionResponse = deviceAccessResponse.payload;

        if (isRejected(signTransactionResponse)) {
            return signTransactionResponse.payload
                ? err(signTransactionResponse.payload)
                : signingFailed('Signing was rejected without a reason.');
        }

        return ok(signTransactionResponse.payload.signedTx);
    };

export const injectSignSendFormTransaction = (
    services: SignSendFormTransactionDep,
): SignSendFormTransactionDep => ({
    signSendFormTransaction: services.signSendFormTransaction,
});
