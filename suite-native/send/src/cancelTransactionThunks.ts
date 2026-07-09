import { isRejected } from '@reduxjs/toolkit';

import { selectIsMevProtectionFeatureEnabled } from '@suite-common/mev';
import { createThunk } from '@suite-common/redux-utils';
import {
    type PushTransactionError,
    type SignTransactionError,
    type SignTransactionTimeoutError,
    pushSendFormTransactionThunk,
    selectAccountByKey,
    selectIsMevProtectionEnabled,
    sendFormActions,
} from '@suite-common/wallet-core';
import {
    type AccountKey,
    type FormState,
    type PrecomposedTransactionFinalCancelRbf,
} from '@suite-common/wallet-types';
import { type Ok } from '@trezor/type-utils';

import { SEND_MODULE_PREFIX } from './constants';
import { cleanupSendFormThunk, signTransactionNativeThunk } from './sendFormThunks';

type SignAndPushEvmCancelTransactionThunkParams = {
    accountKey: AccountKey;
    composedCancelTx: PrecomposedTransactionFinalCancelRbf;
    cancelFormState: FormState;
};

type SignAndPushEvmCancelTransactionError =
    | SignTransactionError
    | SignTransactionTimeoutError
    | PushTransactionError
    | undefined;

/**
 * Signs and broadcasts a composed EVM cancel transaction (see
 * composeEthereumCancelTransactionThunk). The cancel form state is stored as the account's send
 * draft so the regular native signing pipeline can be reused; the draft and send state are always
 * cleaned up afterwards, replacing any unfinished send draft of the account.
 */
export const signAndPushEvmCancelTransactionThunk = createThunk<
    Ok<{ txid: string }>,
    SignAndPushEvmCancelTransactionThunkParams,
    { rejectValue: SignAndPushEvmCancelTransactionError }
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
            dispatch(sendFormActions.storeDraft({ accountKey, formState: cancelFormState }));

            const signResponse = await dispatch(
                signTransactionNativeThunk({ accountKey, feeLevel: composedCancelTx }),
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
            dispatch(cleanupSendFormThunk({ accountKey, shouldDeleteDraft: true }));
        }
    },
);
