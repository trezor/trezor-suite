import { D, pipe } from '@mobily/ts-belt';
import { isFulfilled, isRejected } from '@reduxjs/toolkit';

import { createThunk } from '@suite-common/redux-utils';
import { getNetwork } from '@suite-common/wallet-config';
import {
    composeSendFormTransactionFeeLevelsThunk,
    selectAccountByKey,
    selectConvertedNetworkFeeInfo,
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
import { type FeeLevelsMaxAmount } from './types/fees';

const TRANSACTION_MANAGEMENT_PREFIX = '@suite-native/transaction-management';

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
