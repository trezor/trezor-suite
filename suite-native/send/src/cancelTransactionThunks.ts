import { isRejected } from '@reduxjs/toolkit';

import {
    type MevProtectionRootState,
    selectIsMevProtectionFeatureEnabled,
} from '@suite-common/mev';
import { createThunk } from '@suite-common/redux-utils';
import {
    type AccountsRootState,
    type PushSendFormTransactionThunkDeps,
    type PushSendFormTransactionThunkState,
    type PushTransactionError,
    type SignTransactionError,
    type SignTransactionTimeoutError,
    type WalletSettingsRootState,
    pushSendFormTransactionThunk,
    selectAccountByKey,
    selectIsMevProtectionEnabled,
} from '@suite-common/wallet-core';
import {
    type AccountKey,
    type FormState,
    type PrecomposedTransactionFinalCancelRbf,
} from '@suite-common/wallet-types';
import { type Ok } from '@trezor/type-utils';

import { SEND_MODULE_PREFIX } from './constants';
import {
    type CleanupSendFormThunkState,
    type SignTransactionNativeThunkState,
    cleanupSendFormThunk,
    signTransactionNativeThunk,
} from './sendFormThunks';

type SignAndPushEvmCancelTransactionThunkParams = {
    accountKey: AccountKey;
    composedCancelTx: PrecomposedTransactionFinalCancelRbf;
    cancelFormState: FormState;
};

export type SignAndPushEvmCancelTransactionError =
    SignTransactionError | SignTransactionTimeoutError | PushTransactionError | undefined;

type SignAndPushEvmCancelTransactionThunkState = AccountsRootState &
    WalletSettingsRootState &
    MevProtectionRootState &
    SignTransactionNativeThunkState &
    PushSendFormTransactionThunkState &
    CleanupSendFormThunkState;

type SignAndPushEvmCancelTransactionThunkDeps = PushSendFormTransactionThunkDeps;

/**
 * Signs and broadcasts a composed EVM cancel transaction (see
 * composeEthereumCancelTransactionThunk) through the regular native signing pipeline; the send
 * state is always cleaned up afterwards. The account's send draft is left untouched.
 */
export const signAndPushEvmCancelTransactionThunk = createThunk<
    Ok<{ txid: string }>,
    SignAndPushEvmCancelTransactionThunkParams,
    {
        rejectValue: SignAndPushEvmCancelTransactionError;
        state: SignAndPushEvmCancelTransactionThunkState;
        extra: SignAndPushEvmCancelTransactionThunkDeps;
    }
>(
    `${SEND_MODULE_PREFIX}/signAndPushEvmCancelTransactionThunk`,
    async (
        { accountKey, composedCancelTx, cancelFormState },
        { dispatch, getState, rejectWithValue, fulfillWithValue },
    ) => {
        const account = selectAccountByKey(getState(), accountKey);
        if (!account) {
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Account not found.',
            });
        }

        try {
            const signResponse = await dispatch(
                signTransactionNativeThunk({
                    accountKey,
                    feeLevel: composedCancelTx,
                    formState: cancelFormState,
                }),
            );
            if (isRejected(signResponse)) {
                return rejectWithValue(signResponse.payload);
            }

            const isMevProtectionEnabled =
                selectIsMevProtectionEnabled(getState()) &&
                selectIsMevProtectionFeatureEnabled(getState());
            const pushResponse = await dispatch(
                pushSendFormTransactionThunk({ selectedAccount: account, isMevProtectionEnabled }),
            );
            if (isRejected(pushResponse)) {
                return rejectWithValue(pushResponse.payload);
            }

            return fulfillWithValue(pushResponse.payload);
        } finally {
            dispatch(cleanupSendFormThunk({ accountKey, shouldDeleteDraft: false }));
        }
    },
);
