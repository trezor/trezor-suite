import { G } from '@mobily/ts-belt';
import { isRejected } from '@reduxjs/toolkit';

import { createThunk } from '@suite-common/redux-utils';
import {
    enhancePrecomposedTransactionThunk,
    pushSendFormTransactionThunk,
    selectAccountByKey,
    selectSendFormDraftByAccountKey,
    sendFormActions,
    signTransactionThunk,
} from '@suite-common/wallet-core';
import {
    Account,
    AccountKey,
    GeneralPrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import { SignedTransaction } from '@trezor/connect';

const SEND_MODULE_PREFIX = '@suite-native/send';

// TODO: better naming
export const signTransactionFeeLevelSigningThunk = createThunk(
    `${SEND_MODULE_PREFIX}/signTransactionFeeLevelSigningThunk`,
    async (
        {
            accountKey,
            feeLevel,
        }: {
            accountKey: AccountKey;
            feeLevel: GeneralPrecomposedTransactionFinal;
        },
        { dispatch, rejectWithValue, fulfillWithValue, getState },
    ) => {
        const account = selectAccountByKey(getState(), accountKey);
        const formState = selectSendFormDraftByAccountKey(getState(), accountKey);

        if (!account) return rejectWithValue('Account not found.');
        if (!formState) return rejectWithValue('Form draft not found.');

        // prepare transaction with select fee level
        const precomposedTransaction = await dispatch(
            enhancePrecomposedTransactionThunk({
                transactionFormValues: formState,
                precomposedTransaction: feeLevel,
                selectedAccount: account,
            }),
        ).unwrap();

        if (!precomposedTransaction)
            return rejectWithValue('Thunk prepareTransactionForSigningThunk failed.');
        const signTransactionResponse = await requestPrioritizedDeviceAccess({
            deviceCallback: () =>
                dispatch(
                    signTransactionThunk({
                        formState,
                        precomposedTransaction,
                        selectedAccount: account,
                    }),
                ).unwrap(),
        });

        if (
            !signTransactionResponse.success ||
            G.isNullable(signTransactionResponse.payload?.signedTx)
        )
            return rejectWithValue('Device failed to sign the transaction.');

        return fulfillWithValue(signTransactionResponse.payload.signedTx);
    },
);

export const sendTransactionAndCleanupSendFormThunk = createThunk(
    `${SEND_MODULE_PREFIX}/sendTransactionAndCleanupSendFormThunk`,
    async (
        {
            account,
        }: { account: Account; signedTransaction: SignedTransaction['signedTransaction'] },
        { dispatch, rejectWithValue },
    ) => {
        const response = await dispatch(
            pushSendFormTransactionThunk({
                selectedAccount: account,
            }),
        );

        if (isRejected(response)) {
            return rejectWithValue(response.error);
        }

        dispatch(sendFormActions.dispose());
        dispatch(sendFormActions.removeDraft({ accountKey: account.key }));

        return response.payload;
    },
);
