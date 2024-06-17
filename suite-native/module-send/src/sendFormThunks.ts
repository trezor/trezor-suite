import { G } from '@mobily/ts-belt';
import { isRejected } from '@reduxjs/toolkit';

import { createThunk } from '@suite-common/redux-utils';
import {
    ComposeActionContext,
    composeSendFormTransactionThunk,
    deviceActions,
    enhancePrecomposedTransactionThunk,
    pushSendFormTransactionThunk,
    selectAccountByKey,
    selectDevice,
    selectNetworkFeeInfo,
    sendFormActions,
    signTransactionThunk,
} from '@suite-common/wallet-core';
import { Account, AccountKey, FormState } from '@suite-common/wallet-types';
import { getNetwork } from '@suite-common/wallet-utils';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import { BlockbookTransaction } from '@trezor/blockchain-link-types';
import { SignedTransaction } from '@trezor/connect';

const SEND_MODULE_PREFIX = '@suite-native/send';

export const onDeviceTransactionReviewThunk = createThunk<
    BlockbookTransaction,
    { accountKey: AccountKey; formState: FormState },
    { rejectValue: string }
>(
    `${SEND_MODULE_PREFIX}/onDeviceTransactionReviewThunk`,
    async (
        { accountKey, formState },
        { dispatch, getState, rejectWithValue, fulfillWithValue },
    ) => {
        const account = selectAccountByKey(getState(), accountKey);
        const device = selectDevice(getState());
        const networkFeeInfo = selectNetworkFeeInfo(getState(), account?.symbol);

        if (!account || !networkFeeInfo || !device)
            return rejectWithValue('Failed to get account, fee info or device from redux store.');

        const network = getNetwork(account.symbol);

        if (!network)
            return rejectWithValue('Failed to derive account network from account symbol.');
        const composeContext: ComposeActionContext = {
            account,
            network,
            feeInfo: networkFeeInfo,
        };

        dispatch(deviceActions.removeButtonRequests({ device }));

        //compose transaction with specific fee levels
        const precomposedFeeLevels = await dispatch(
            composeSendFormTransactionThunk({
                formValues: formState,
                formState: composeContext,
            }),
        ).unwrap();

        // TODO: select fee level based on user selection when there is fee input added to the send form.
        const selectedFeeLevel = precomposedFeeLevels?.normal;

        if (!selectedFeeLevel || selectedFeeLevel.type !== 'final')
            return rejectWithValue('Requested fee level not found in composed transaction levels.');

        // prepare transaction with select fee level
        const precomposedTransaction = await dispatch(
            enhancePrecomposedTransactionThunk({
                transactionFormValues: formState,
                precomposedTransaction: selectedFeeLevel,
                selectedAccount: account,
            }),
        ).unwrap();

        if (!precomposedTransaction)
            return rejectWithValue('Thunk prepareTransactionForSigningThunk failed.');
        const signTransactionResponse = await requestPrioritizedDeviceAccess(() =>
            dispatch(
                signTransactionThunk({
                    formValues: formState,
                    precomposedTransaction,
                    selectedAccount: account,
                }),
            ).unwrap(),
        );

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
            return rejectWithValue(response.error ?? 'Failed to push transaction to blockchain.');
        }

        dispatch(sendFormActions.dispose());
        dispatch(sendFormActions.removeDraft({ accountKey: account.key }));

        return response.payload;
    },
);
