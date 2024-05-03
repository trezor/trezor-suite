import { G } from '@mobily/ts-belt';

import { createThunk } from '@suite-common/redux-utils';
import {
    composeSendFormTransactionThunk,
    deviceActions,
    prepareTransactionForSigningThunk,
    pushSendFormTransactionThunk,
    selectAccountByKey,
    selectDevice,
    selectNetworkFeeInfo,
    selectSendFormDraftByAccountKey,
    sendFormActions,
    signTransactionThunk,
} from '@suite-common/wallet-core';
import { Account, AccountKey, ComposeActionContext } from '@suite-common/wallet-types';
import { getNetwork } from '@suite-common/wallet-utils';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import { SignedTransaction } from '@trezor/connect';

const SEND_MODULE_PREFIX = '@suite-native/send';

export const onDeviceTransactionReviewThunk = createThunk(
    `${SEND_MODULE_PREFIX}/onDeviceTransactionReviewThunk`,
    async ({ accountKey }: { accountKey: AccountKey }, { dispatch, getState, rejectWithValue }) => {
        const account = selectAccountByKey(getState(), accountKey);
        const device = selectDevice(getState());
        const networkFeeInfo = selectNetworkFeeInfo(getState(), account?.symbol);

        const formState = selectSendFormDraftByAccountKey(getState(), accountKey);

        if (!account || !formState || !networkFeeInfo || !device)
            return rejectWithValue(
                'Failed to get account, formState, networkFeeInfo or device from redux store.',
            );

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
        const composedTransactionFeeLevels = await dispatch(
            composeSendFormTransactionThunk({
                formValues: formState,
                formState: composeContext,
            }),
        ).unwrap();

        // TODO: select fee level based on user selection when there is fee input added to the send form.
        const selectedFeeLevel = composedTransactionFeeLevels?.normal;

        if (!selectedFeeLevel || selectedFeeLevel.type !== 'final')
            return rejectWithValue('Requested fee level not found in composed transaction levels.');

        // prepare transaction with select fee level
        const enhancedTx = await dispatch(
            prepareTransactionForSigningThunk({
                transactionFormValues: formState,
                transactionInfo: selectedFeeLevel,
                selectedAccount: account,
            }),
        ).unwrap();

        if (!enhancedTx) return rejectWithValue('Thunk prepareTransactionForSigningThunk failed.');

        const deviceAccessResponse = await requestPrioritizedDeviceAccess(() =>
            dispatch(
                signTransactionThunk({
                    formValues: formState,
                    transactionInfo: enhancedTx,
                    selectedAccount: account,
                }),
            ).unwrap(),
        );

        if (
            !deviceAccessResponse.success ||
            G.isNullable(deviceAccessResponse.payload?.signedTransaction)
        )
            return rejectWithValue('Device failed to sign the transaction.');

        return deviceAccessResponse.payload.signedTransaction;
    },
);

export const sendTransactionAndCleanupSendFormThunk = createThunk(
    `${SEND_MODULE_PREFIX}/sendTransactionAndCleanupSendFormThunk`,
    async (
        {
            account,
            signedTransaction,
        }: { account: Account; signedTransaction: SignedTransaction['signedTransaction'] },
        { dispatch, rejectWithValue },
    ) => {
        const response = await dispatch(
            pushSendFormTransactionThunk({ selectedAccount: account, signedTransaction }),
        ).unwrap();

        if (!response || !response.success) {
            return rejectWithValue(
                response?.payload.error ?? 'Failed to push transaction to blockchain.',
            );
        }

        dispatch(sendFormActions.dispose());
        dispatch(sendFormActions.removeDraft({ accountKey: account.key }));

        return response.payload;
    },
);
