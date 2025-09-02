import { D, G, pipe } from '@mobily/ts-belt';
import { isFulfilled, isRejected } from '@reduxjs/toolkit';

import { createThunk } from '@suite-common/redux-utils';
import { getNetwork } from '@suite-common/wallet-config';
import {
    PushTransactionError,
    SignTransactionError,
    SignTransactionTimeoutError,
    composeSendFormTransactionFeeLevelsThunk,
    deviceActions,
    enhancePrecomposedTransactionThunk,
    pushSendFormTransactionThunk,
    selectAccountByKey,
    selectConvertedNetworkFeeInfo,
    selectSelectedDevice,
    selectSendFormDraftByKey,
    selectSendFormDrafts,
    sendFormActions,
    signTransactionThunk,
} from '@suite-common/wallet-core';
import {
    Account,
    AccountKey,
    FormState,
    GeneralPrecomposedTransactionFinal,
    TokenAddress,
    isFinalPrecomposedTransaction,
} from '@suite-common/wallet-types';
import { hasNetworkFeatures } from '@suite-common/wallet-utils';
import { EventType, analytics } from '@suite-native/analytics';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import { selectAccountTokenSymbol } from '@suite-native/tokens';
import {
    FeeLevelsMaxAmount,
    NativeSupportedFeeLevel,
    storeFeeLevels,
} from '@suite-native/transaction-management';
import { BlockbookTransaction } from '@trezor/blockchain-link-types';
import { Success } from '@trezor/connect';

import { SEND_MODULE_PREFIX } from './constants';
import { sendFormAddLabelingThunk } from './sendFormAddLabelingThunk';

export const signTransactionNativeThunk = createThunk<
    BlockbookTransaction | undefined,
    {
        accountKey: AccountKey;
        feeLevel: GeneralPrecomposedTransactionFinal;
        tokenContract?: TokenAddress;
    },
    { rejectValue: SignTransactionError | SignTransactionTimeoutError | undefined }
>(
    `${SEND_MODULE_PREFIX}/signTransactionNativeThunk`,
    async (
        { accountKey, tokenContract, feeLevel },
        { dispatch, rejectWithValue, fulfillWithValue, getState },
    ) => {
        const account = selectAccountByKey(getState(), accountKey);
        const formState = selectSendFormDraftByKey(getState(), accountKey, tokenContract);

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
        const device = selectSelectedDevice(getState());

        dispatch(sendFormActions.dispose());

        if (shouldDeleteDraft) dispatch(sendFormActions.removeDraft({ accountKey }));

        // todo: maybe not needed anymore
        dispatch(deviceActions.removeButtonRequests({ device }));
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

export const calculateFeeLevelsMaxAmountThunk = createThunk<
    FeeLevelsMaxAmount,
    { formState: FormState; accountKey: AccountKey }
>(
    `${SEND_MODULE_PREFIX}/calculateMaxAmountThunk`,
    async ({ formState, accountKey }, { dispatch, getState }) => {
        const account = selectAccountByKey(getState(), accountKey);
        if (!account) throw new Error('Account not found.');

        const networkFeeInfo = selectConvertedNetworkFeeInfo(getState(), account.symbol);
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
            return pipe(
                response.payload,
                D.filter(x => 'max' in x),
                D.map(y => (y as GeneralPrecomposedTransactionFinal).max),
            ) as FeeLevelsMaxAmount;
        }

        throw new Error('Unable to get the max amounts.');
    },
);

export type UpdateSelectedFeeLevelThunkParams = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
} & (
    | {
          feeLevelLabel: Exclude<NativeSupportedFeeLevel, 'custom'>;
          feePerUnit?: never;
          feeLimit?: never;
      }
    | { feeLevelLabel: 'custom'; feePerUnit: string; feeLimit?: string }
);

export const updateSelectedFeeLevelThunk = createThunk(
    `${SEND_MODULE_PREFIX}/updateSelectedFeeLevelThunk`,
    (
        {
            accountKey,
            tokenContract,
            feeLevelLabel,
            feePerUnit,
            feeLimit,
        }: UpdateSelectedFeeLevelThunkParams,
        { dispatch, getState },
    ) => {
        const draft = selectSendFormDraftByKey(getState(), accountKey, tokenContract);

        if (!draft) throw Error('Draft not found.');
        const draftCopy = { ...draft };

        draftCopy.selectedFee = feeLevelLabel;
        if (feePerUnit) {
            draftCopy.feePerUnit = feePerUnit;
        }
        if (feeLimit) {
            draftCopy.feeLimit = feeLimit;
        }

        dispatch(sendFormActions.storeDraft({ accountKey, tokenContract, formState: draftCopy }));
    },
);

export const calculateCustomFeeLevelThunk = createThunk(
    `${SEND_MODULE_PREFIX}/calculateCustomFeeLevelThunk`,
    async (
        {
            accountKey,
            tokenContract,
            feePerUnit,
            feeLimit,
        }: {
            accountKey: AccountKey;
            feePerUnit: string;
            feeLimit?: string;
            tokenContract?: TokenAddress;
        },
        { dispatch, getState },
    ) => {
        const account = selectAccountByKey(getState(), accountKey);
        const feeInfo = selectConvertedNetworkFeeInfo(getState(), account?.symbol);

        const draft = selectSendFormDraftByKey(getState(), accountKey, tokenContract);

        if (!draft || !account || !feeInfo) throw Error('Draft not found.');

        const network = getNetwork(account.symbol);

        const draftCopy = { ...draft };

        draftCopy.selectedFee = 'custom';
        draftCopy.feePerUnit = feePerUnit;
        if (feeLimit) {
            draftCopy.feeLimit = feeLimit;
        }

        const response = await dispatch(
            composeSendFormTransactionFeeLevelsThunk({
                formState: draftCopy,
                composeContext: {
                    account,
                    feeInfo,
                    network,
                },
            }),
        );

        if (isRejected(response)) {
            throw Error(response.payload?.message ?? 'Unable to compose fresh fee levels.');
        }

        const feeLevels = response.payload;
        dispatch(storeFeeLevels({ feeLevels }));

        if (!isFinalPrecomposedTransaction(feeLevels.custom)) {
            throw Error('Unable to compose custom fee level.');
        }
    },
);

type SendTransactionThunkParams = {
    selectedAccount: Account;
    wasAppLeftDuringReview: boolean;
    tokenContract?: TokenAddress;
};

export const sendTransactionThunk = createThunk<
    Success<{ txid: string }>,
    SendTransactionThunkParams,
    { rejectValue: PushTransactionError }
>(
    `${SEND_MODULE_PREFIX}/sendTransactionThunk`,
    async (
        { selectedAccount, wasAppLeftDuringReview, tokenContract },
        { dispatch, getState, rejectWithValue, fulfillWithValue },
    ) => {
        const sendResponse = await dispatch(pushSendFormTransactionThunk({ selectedAccount }));

        if (sendResponse.payload === undefined) {
            return rejectWithValue({
                error: 'push-transaction-failed',
                metadata: { success: false, payload: { error: 'Payload is undefined.' } },
            });
        }

        if (!('success' in sendResponse.payload)) {
            return rejectWithValue(sendResponse.payload);
        }

        const formValues = selectSendFormDraftByKey(getState(), selectedAccount.key, tokenContract);

        if (formValues !== null) {
            await dispatch(
                sendFormAddLabelingThunk({
                    txId: sendResponse.payload.payload.txid,
                    selectedAccount,
                }),
            );

            const tokenSymbol = selectAccountTokenSymbol(
                getState(),
                selectedAccount.key,
                tokenContract,
            );

            analytics.report({
                type: EventType.SendTransactionDispatched,
                payload: {
                    symbol: selectedAccount.symbol,
                    tokenAddresses: tokenContract ? [tokenContract] : undefined,
                    tokenSymbols: tokenSymbol ? [tokenSymbol] : undefined,
                    outputsCount: formValues.outputs.length,
                    selectedFee: formValues.selectedFee ?? 'normal',
                    hasDestinationTag: G.isNotNullable(formValues.destinationTag),
                    wasAppLeftDuringReview,
                },
            });
        }

        return fulfillWithValue(sendResponse.payload);
    },
);
