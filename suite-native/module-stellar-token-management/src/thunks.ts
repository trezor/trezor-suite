import { isFulfilled } from '@reduxjs/toolkit';

import { createThunk } from '@suite-common/redux-utils';
import { getNetwork } from '@suite-common/wallet-config';
import {
    type FormDraftRootState,
    composeSendFormTransactionFeeLevelsThunk,
    formDraftActions,
    selectAccountByKey,
    selectConvertedNetworkFeeInfo,
    selectDeepCopyOfFormDraft,
} from '@suite-common/wallet-core';
import {
    type AccountKey,
    type FormState,
    type PrecomposedTransactionFinal,
    type TokenAddress,
    isFinalPrecomposedTransaction,
} from '@suite-common/wallet-types';
import {
    type UpdateSelectedFeeLevelThunkParams,
    transactionManagementActions,
} from '@suite-native/transaction-management';

const STELLAR_TOKEN_MODULE_PREFIX = '@suite-native/stellar-token';

const STELLAR_DEFAULT_FEE_STROOPS = '100';

const STELLAR_TOKEN_FORM_DRAFT_PREFIX = 'stellar-token';

/**
 * Generates a unique form draft key for Stellar token operations.
 */
export const getStellarTokenFormDraftKey = (accountKey: AccountKey, tokenContract: TokenAddress) =>
    `${STELLAR_TOKEN_FORM_DRAFT_PREFIX}/${accountKey}/${tokenContract}`;

/**
 * Updates the selected fee level for Stellar token operations.
 * Stores the updated form draft in Redux.
 */
export const updateStellarTokenSelectedFeeLevelThunk = createThunk(
    `${STELLAR_TOKEN_MODULE_PREFIX}/updateSelectedFeeLevel`,
    (
        { feeLevelLabel, feePerUnit, formDraftKey }: UpdateSelectedFeeLevelThunkParams,
        { dispatch, getState },
    ) => {
        if (!formDraftKey) {
            return;
        }

        const formDraft = selectDeepCopyOfFormDraft(
            getState() as FormDraftRootState,
            formDraftKey,
        ) as FormState | undefined;

        if (!formDraft) {
            return;
        }

        formDraft.selectedFee = feeLevelLabel;
        if (feePerUnit) {
            formDraft.feePerUnit = feePerUnit;
        }

        dispatch(formDraftActions.storeDraft({ key: formDraftKey, formDraft }));
    },
);

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
    `${STELLAR_TOKEN_MODULE_PREFIX}/composeTrustlineFees`,
    async (
        { accountKey, tokenContract }: ComposeStellarTrustlineFeesParams,
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

            // Get the actual composed normal fee to use as default for custom fee
            const composedNormalFee = isFinalPrecomposedTransaction(result.payload.normal)
                ? (result.payload.normal as PrecomposedTransactionFinal).feePerByte
                : normalFeePerUnit;

            // Store form draft for fee selection with the composed fee
            const formDraftKey = getStellarTokenFormDraftKey(accountKey, tokenContract);
            dispatch(
                formDraftActions.storeDraft({
                    key: formDraftKey,
                    formDraft: { ...formState, feePerUnit: composedNormalFee },
                }),
            );

            return fulfillWithValue(result.payload);
        }

        return rejectWithValue('Failed to compose fee levels');
    },
);
