import { isFulfilled } from '@reduxjs/toolkit';

import { createThunk } from '@suite-common/redux-utils';
import { getNetwork } from '@suite-common/wallet-config';
import {
    composeSendFormTransactionFeeLevelsThunk,
    selectAccountByKey,
    selectConvertedNetworkFeeInfo,
} from '@suite-common/wallet-core';
import { AccountKey, FormState, TokenAddress } from '@suite-common/wallet-types';
import { transactionManagementActions } from '@suite-native/transaction-management';

const STELLAR_TOKEN_THUNK_PREFIX = 'stellarToken';

const STELLAR_DEFAULT_FEE_STROOPS = '100';

/**
 * Creates a minimal FormState for Stellar trustline operations.
 * Uses a "self-send" with amount 0 to satisfy the form requirements.
 */
const createTrustlineFormState = (address: string, feePerUnit: string): FormState => ({
    outputs: [
        {
            type: 'payment',
            address,
            amount: '0',
            fiat: '',
            currency: { label: '', value: '' },
            label: '',
            token: null,
        },
    ],
    setMaxOutputId: undefined,
    selectedFee: 'normal',
    feePerUnit,
    feeLimit: '',
    estimatedFeeLimit: undefined,
    options: ['broadcast'],
    bitcoinLocktimeBlockHeight: '',
    bitcoinLocktimeDatetime: '',
    ethereumNonce: '',
    ethereumDataAscii: '',
    ethereumAdjustGasLimit: '',
    transactionData: '',
    rbfParams: undefined,
    isCoinControlEnabled: false,
    hasCoinControlBeenOpened: false,
    selectedUtxos: [],
});

type ComposeStellarTrustlineFeesParams = {
    accountKey: AccountKey;
    tokenContract: TokenAddress;
};

/**
 * Composes fee levels for Stellar trustline operations (activation/deactivation).
 * This should be called BEFORE navigating to the fee screen to ensure feeLevels
 * are available in Redux when the screen renders.
 */
export const composeStellarTrustlineFeesThunk = createThunk(
    `${STELLAR_TOKEN_THUNK_PREFIX}/composeTrustlineFees`,
    async (
        { accountKey }: ComposeStellarTrustlineFeesParams,
        { dispatch, getState, rejectWithValue, fulfillWithValue },
    ) => {
        const account = selectAccountByKey(getState(), accountKey);
        if (!account) {
            return rejectWithValue('Account not found');
        }

        const feeInfo = selectConvertedNetworkFeeInfo(getState(), account.symbol);
        if (!feeInfo) {
            return rejectWithValue('Fee info not available');
        }

        const network = getNetwork(account.symbol);
        const normalFeeLevel = feeInfo.levels.find(level => level.label === 'normal');
        const normalFeePerUnit = normalFeeLevel?.feePerUnit ?? STELLAR_DEFAULT_FEE_STROOPS;

        const formState = createTrustlineFormState(account.descriptor, normalFeePerUnit);

        const result = await dispatch(
            composeSendFormTransactionFeeLevelsThunk({
                formState,
                composeContext: {
                    account,
                    network,
                    feeInfo,
                },
            }),
        );

        if (isFulfilled(result)) {
            dispatch(transactionManagementActions.storeFeeLevels({ feeLevels: result.payload }));

            return fulfillWithValue(result.payload);
        }

        return rejectWithValue('Failed to compose fee levels');
    },
);
