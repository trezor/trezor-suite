import { isFulfilled, isRejected } from '@reduxjs/toolkit';

import { createThunk } from '@suite-common/redux-utils';
import { getNetwork } from '@suite-common/wallet-config';
import {
    PushTransactionError,
    deviceActions,
    enhancePrecomposedTransactionThunk,
    pushSendFormTransactionThunk,
    selectAccountByKey,
    selectDevice,
    selectSendFormDraftByAccountKey,
    sendFormActions,
    signTransactionThunk,
    selectSendFormDrafts,
    composeSendFormTransactionFeeLevelsThunk,
    selectNetworkFeeInfo,
    SignTransactionError,
} from '@suite-common/wallet-core';
import {
    Account,
    AccountKey,
    FeeLevelLabel,
    FormState,
    GeneralPrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import { hasNetworkFeatures } from '@suite-common/wallet-utils';
import { BlockbookTransaction } from '@trezor/blockchain-link-types';

const SEND_MODULE_PREFIX = '@suite-native/send';

export const signTransactionNativeThunk = createThunk<
    BlockbookTransaction | undefined,
    {
        accountKey: AccountKey;
        feeLevel: GeneralPrecomposedTransactionFinal;
    },
    { rejectValue: SignTransactionError | undefined }
>(
    `${SEND_MODULE_PREFIX}/signTransactionNativeThunk`,
    async ({ accountKey, feeLevel }, { dispatch, rejectWithValue, fulfillWithValue, getState }) => {
        const account = selectAccountByKey(getState(), accountKey);
        const formState = selectSendFormDraftByAccountKey(getState(), accountKey);
        const device = selectDevice(getState());

        if (!account || !formState)
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Account or form draft not found.',
            });

        // prepare transaction with select fee level
        const precomposedTransaction = await dispatch(
            enhancePrecomposedTransactionThunk({
                transactionFormValues: formState,
                precomposedTransaction: feeLevel,
                selectedAccount: account,
            }),
        ).unwrap();

        if (!precomposedTransaction)
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Unable to precompose transaction for signing.',
            });
        const deviceAccessResponse = await requestPrioritizedDeviceAccess({
            deviceCallback: () =>
                dispatch(
                    signTransactionThunk({
                        formState,
                        precomposedTransaction,
                        selectedAccount: account,
                    }),
                ),
        });

        if (!deviceAccessResponse.success) {
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Prioritized device access failed.',
            });
        }

        const signTransactionResponse = deviceAccessResponse.payload;

        if (isRejected(signTransactionResponse)) {
            dispatch(deviceActions.removeButtonRequests({ device }));

            return rejectWithValue(signTransactionResponse.payload);
        }

        return fulfillWithValue(signTransactionResponse.payload.signedTx);
    },
);

export const cleanupSendFormThunk = createThunk(
    `${SEND_MODULE_PREFIX}/cleanupSendFormThunk`,
    (
        {
            accountKey,
            shouldDeleteDraft = true,
        }: { accountKey: AccountKey; shouldDeleteDraft?: boolean },
        { dispatch, getState },
    ) => {
        const device = selectDevice(getState());

        dispatch(sendFormActions.dispose());

        if (shouldDeleteDraft) dispatch(sendFormActions.removeDraft({ accountKey }));

        dispatch(deviceActions.removeButtonRequests({ device }));
    },
);

export const sendTransactionAndCleanupSendFormThunk = createThunk<
    { txid: string },
    { account: Account },
    { rejectValue: PushTransactionError }
>(
    `${SEND_MODULE_PREFIX}/sendTransactionAndCleanupSendFormThunk`,
    async ({ account }, { dispatch, rejectWithValue }) => {
        const response = await dispatch(
            pushSendFormTransactionThunk({
                selectedAccount: account,
            }),
        );

        if (isRejected(response)) {
            return rejectWithValue(response.payload!);
        }

        dispatch(cleanupSendFormThunk({ accountKey: account.key }));

        return response.payload.payload;
    },
);

export const removeSendFormDraftsSupportingAmountUnitThunk = createThunk(
    `${SEND_MODULE_PREFIX}/removeSendFormDraftsSupportingAmountUnitThunk`,
    (_, { dispatch, getState }) => {
        const sendFormDrafts = selectSendFormDrafts(getState());
        const accountKeys = Object.keys(sendFormDrafts);

        accountKeys.forEach(accountKey => {
            const account = selectAccountByKey(getState(), accountKey);
            if (account && hasNetworkFeatures(account, 'amount-unit')) {
                dispatch(sendFormActions.removeDraft({ accountKey }));
            }
        });
    },
);

export const calculateMaxAmountWithNormalFeeThunk = createThunk<
    string | undefined,
    { formState: FormState; accountKey: AccountKey }
>(
    `${SEND_MODULE_PREFIX}/calculateMaxAmountWithNormalFeeThunk`,
    async ({ formState, accountKey }, { dispatch, getState }) => {
        const account = selectAccountByKey(getState(), accountKey);
        if (!account) throw new Error('Account not found.');

        const networkFeeInfo = selectNetworkFeeInfo(getState(), account.symbol);
        const network = getNetwork(account.symbol);

        if (!networkFeeInfo) throw new Error('Network fees not found.');

        const response = await dispatch(
            composeSendFormTransactionFeeLevelsThunk({
                formState: {
                    ...formState,
                    setMaxOutputId: 0, // Marks first outputs as the one that should be maximized.
                },
                composeContext: {
                    account,
                    network,
                    feeInfo: networkFeeInfo,
                },
            }),
        );

        if (isFulfilled(response)) {
            if (response.payload.normal.type !== 'error') {
                return response.payload.normal.max;
            }
        }
    },
);

export const updateDraftFeeLevelThunk = createThunk(
    `${SEND_MODULE_PREFIX}/updateDraftFeeLevelThunk`,
    (
        { accountKey, feeLevel }: { accountKey: AccountKey; feeLevel: FeeLevelLabel },
        { dispatch, getState },
    ) => {
        const draft = selectSendFormDraftByAccountKey(getState(), accountKey);

        if (!draft) throw Error('Draft not found.');
        const draftCopy = { ...draft };

        draftCopy.selectedFee = feeLevel;

        dispatch(sendFormActions.storeDraft({ accountKey, formState: draftCopy }));
    },
);
