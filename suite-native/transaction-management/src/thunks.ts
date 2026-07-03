import { D, pipe } from '@mobily/ts-belt';
import { isFulfilled, isRejected } from '@reduxjs/toolkit';

import { createThunk } from '@suite-common/redux-utils';
import { getNetwork } from '@suite-common/wallet-config';
import { DEFAULT_PAYMENT, DEFAULT_VALUES } from '@suite-common/wallet-constants';
import {
    composeSendFormTransactionFeeLevelsThunk,
    getEthereumRbfFeeInfo,
    selectAccountByKey,
    selectConvertedNetworkFeeInfo,
    selectSendFormDraftByKey,
    selectTransactionByAccountKeyAndTxid,
    sendFormActions,
} from '@suite-common/wallet-core';
import {
    type AccountKey,
    type FormState,
    type GeneralPrecomposedTransactionFinal,
    type PrecomposedLevels,
    type PrecomposedLevelsCardano,
    isFinalPrecomposedTransaction,
} from '@suite-common/wallet-types';

import { transactionManagementActions } from './sendFormSlice';
import { type FeeLevelsMaxAmount, type UpdateFeeLimitThunkParams } from './types/fees';

const TRANSACTION_MANAGEMENT_PREFIX = '@suite-native/transaction-management';

export const updateFeeLimitThunk = createThunk(
    `${TRANSACTION_MANAGEMENT_PREFIX}/updateFeeLimitThunk`,
    (
        { accountKey, tokenContract, feeLimit }: UpdateFeeLimitThunkParams,
        { dispatch, getState },
    ) => {
        const draft = selectSendFormDraftByKey(getState(), accountKey, tokenContract);
        if (!draft) throw Error('Draft not found.');
        dispatch(
            sendFormActions.storeDraft({
                accountKey,
                tokenContract,
                formState: { ...draft, feeLimit },
            }),
        );
    },
);

export const calculateFeeLevelsMaxAmountThunk = createThunk<
    FeeLevelsMaxAmount,
    { formState: FormState; accountKey: AccountKey }
>(
    `${TRANSACTION_MANAGEMENT_PREFIX}/calculateMaxAmountThunk`,
    async (
        { formState, accountKey },
        { dispatch, getState, rejectWithValue, fulfillWithValue },
    ) => {
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
            return fulfillWithValue(
                pipe(
                    response.payload,
                    D.filter(x => 'max' in x),
                    D.map(y => (y as GeneralPrecomposedTransactionFinal).max),
                ) as FeeLevelsMaxAmount,
            );
        }

        return rejectWithValue('Unable to get the max amounts.');
    },
);

export const calculateCustomFeeLevelThunk = createThunk<
    PrecomposedLevels | PrecomposedLevelsCardano,
    {
        accountKey: AccountKey;
        formState: FormState;
        selectedFeeLevel?: 'custom';
        customFeePerUnit?: string;
        customFeeLimit?: string;
        customMaxFeePerGas?: string;
        customMaxPriorityFeePerGas?: string;
    },
    { rejectValue: string }
>(
    `${TRANSACTION_MANAGEMENT_PREFIX}/calculateCustomFeeLevelThunk`,
    async (
        {
            accountKey,
            formState,
            selectedFeeLevel,
            customFeePerUnit,
            customFeeLimit,
            customMaxFeePerGas,
            customMaxPriorityFeePerGas,
        },
        { dispatch, getState, fulfillWithValue, rejectWithValue },
    ) => {
        const account = selectAccountByKey(getState(), accountKey);
        const feeInfo = selectConvertedNetworkFeeInfo(getState(), account?.symbol);
        if (!account) {
            return rejectWithValue('Account not found.');
        }

        if (!feeInfo) {
            return rejectWithValue('Fee info not found.');
        }

        const network = getNetwork(account.symbol);

        // make a copy of the form state to avoid mutating the original state
        const formStateCopy = { ...formState };
        if (selectedFeeLevel) {
            formStateCopy.selectedFee = selectedFeeLevel;
        }
        if (customFeePerUnit) {
            formStateCopy.feePerUnit = customFeePerUnit;
        }
        if (customFeeLimit) {
            formStateCopy.feeLimit = customFeeLimit;
        }
        if (customMaxFeePerGas) {
            formStateCopy.maxFeePerGas = customMaxFeePerGas;
        }
        if (customMaxPriorityFeePerGas) {
            formStateCopy.maxPriorityFeePerGas = customMaxPriorityFeePerGas;
        }

        const response = await dispatch(
            composeSendFormTransactionFeeLevelsThunk({
                formState: formStateCopy,
                composeContext: {
                    account,
                    feeInfo,
                    network,
                },
            }),
        );

        if (isRejected(response)) {
            return rejectWithValue(
                response.payload?.message ?? 'Unable to compose fresh fee levels.',
            );
        }

        const feeLevels = response.payload;
        dispatch(transactionManagementActions.storeFeeLevels({ feeLevels }));

        if (!isFinalPrecomposedTransaction(feeLevels.custom)) {
            return rejectWithValue('Unable to compose custom fee level.');
        }

        return fulfillWithValue(feeLevels);
    },
);

export const composeEthereumCancelTransactionThunk = createThunk<
    GeneralPrecomposedTransactionFinal,
    { accountKey: AccountKey; txid: string },
    { rejectValue: string }
>(
    `${TRANSACTION_MANAGEMENT_PREFIX}/composeEthereumCancelTransactionThunk`,
    async ({ accountKey, txid }, { dispatch, getState, rejectWithValue, fulfillWithValue }) => {
        const account = selectAccountByKey(getState(), accountKey);

        if (account?.networkType !== 'ethereum') {
            return rejectWithValue('Ethereum account not found.');
        }

        const transaction = selectTransactionByAccountKeyAndTxid(getState(), accountKey, txid);
        const rbfParams = transaction?.rbfParams;

        if (rbfParams?.type !== 'ethereum') {
            return rejectWithValue('Transaction cannot be cancelled.');
        }

        const networkFeeInfo = selectConvertedNetworkFeeInfo(getState(), account.symbol);

        if (!networkFeeInfo) {
            return rejectWithValue('Network fees not found.');
        }

        // Bump the fee above the stuck tx's gas so the replacement is accepted by the mempool.
        const feeInfo = getEthereumRbfFeeInfo(networkFeeInfo, {
            gasPrice: rbfParams.gasPrice,
            maxFeePerGas: rbfParams.maxFeePerGas,
            maxPriorityFeePerGas: rbfParams.maxPriorityFeePerGas,
        });

        // A cancel is a zero-value self-send with empty calldata that reuses the stuck tx's nonce.
        // The nonce is carried via rbfParams and re-applied during signing. Empty calldata makes it
        // a true cancel rather than a replay of the original transfer/contract call.
        const cancelFormState: FormState = {
            ...DEFAULT_VALUES,
            outputs: [
                {
                    ...DEFAULT_PAYMENT,
                    address: account.descriptor,
                    amount: '0',
                },
            ],
            selectedFee: 'normal',
            rbfParams,
        };

        const network = getNetwork(account.symbol);

        const response = await dispatch(
            composeSendFormTransactionFeeLevelsThunk({
                formState: cancelFormState,
                composeContext: { account, network, feeInfo },
            }),
        );

        if (isRejected(response)) {
            return rejectWithValue(
                response.payload?.message ?? 'Unable to compose cancel transaction.',
            );
        }

        const feeLevels = response.payload;
        const composedCancel = feeLevels.normal;

        if (!isFinalPrecomposedTransaction(composedCancel)) {
            return rejectWithValue('Unable to compose cancel transaction.');
        }

        dispatch(transactionManagementActions.storeFeeLevels({ feeLevels }));

        // Persist the cancel form as the account draft so the shared sign/push pipeline
        // (signTransactionNativeThunk → selectSendFormDraftByKey) reuses the stuck tx's nonce.
        dispatch(sendFormActions.storeDraft({ accountKey, formState: cancelFormState }));

        return fulfillWithValue(composedCancel);
    },
);
