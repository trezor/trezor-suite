import { A, pipe } from '@mobily/ts-belt';

import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import type { TokenAddress } from '@suite-common/tokens';
import {
    type AccountsRootState,
    type FormDraftRootState,
    selectAccountByKey,
    selectFormDraft,
    selectPrecomposedSendForm,
    selectSendFormDraftByKey,
    selectSendFormReviewButtonRequestsCount,
    selectSendPrecomposedTx,
    selectSendSerializedTx,
} from '@suite-common/wallet-core';
import type {
    AccountKey,
    FeeLevelLabel,
    FormDraftWithSendKeyPrefix,
    FormState,
    GeneralPrecomposedTransaction,
    TransactionReviewOutputState,
    TransactionReviewStatefulOutput,
    TransactionReviewSummaryOutput,
} from '@suite-common/wallet-types';
import {
    constructTransactionReviewOutputs,
    getDecreaseOutputId,
    getFormDraftKey,
    getIsUpdatedSendFlow,
    getTransactionReviewOutputState,
    isClearSignedEvmTradingSwapTransaction,
} from '@suite-common/wallet-utils';
import { createWeakMapSelector } from '@trezor/redux-utils';
import { BigNumber, isNotNullOrUndefined } from '@trezor/utils';

import { type NativeSendRootState } from './sendFormSlice';

const isStakingPrefix = (
    prefix: FormDraftWithSendKeyPrefix,
): prefix is 'stake' | 'unstake' | 'claim' =>
    prefix === 'stake' || prefix === 'unstake' || prefix === 'claim';

export type TransactionReviewOutputsState = NativeSendRootState &
    AccountsRootState &
    DeviceRootState &
    FormDraftRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<NativeSendRootState>();
const createSendMemoizedSelector = createWeakMapSelector.withTypes<TransactionReviewOutputsState>();

export const selectFeeLevels = (state: NativeSendRootState) => state.wallet.send.feeLevels;

export const selectCustomFeeLevel = (
    state: NativeSendRootState,
): GeneralPrecomposedTransaction | undefined => state.wallet.send.feeLevels.custom;

export const selectFeeLevelTransactionBytes = createMemoizedSelector(
    [selectFeeLevels, (_state: NativeSendRootState, feeLevelLabel: FeeLevelLabel) => feeLevelLabel],
    (feeLevels, feeLevelLabel) => {
        const feeLevel = feeLevels[feeLevelLabel];
        if (feeLevel && feeLevel.type !== 'error') {
            const { bytes, fee, feePerByte, feeLimit } = feeLevel;
            if (bytes !== 0) {
                return feeLevel.bytes;
            }

            // Ethereum-based fee level does not have bytes stored as attribute
            // so we need to calculate it from fee, feePerByte and feeLimit.
            if (fee && feePerByte && feeLimit) {
                return BigNumber(fee).div(feePerByte).div(feeLimit).toNumber();
            }
        }

        return 0;
    },
);

export const selectIsTransactionAlreadySigned = (state: NativeSendRootState) => {
    const serializedTx = selectSendSerializedTx(state);

    return isNotNullOrUndefined(serializedTx);
};

const selectSendReviewButtonRequestsCount = (
    state: TransactionReviewOutputsState,
    accountKey: AccountKey,
    _tokenContract?: TokenAddress,
    precomposedForm?: FormState | null,
) => {
    const account = selectAccountByKey(state, accountKey);
    const precomposedTx = selectSendPrecomposedTx(state);

    const decreaseOutputId = getDecreaseOutputId(precomposedTx, precomposedForm);

    return selectSendFormReviewButtonRequestsCount(state, account?.symbol, decreaseOutputId);
};

export const selectTransactionReviewOutputs = createSendMemoizedSelector(
    [
        selectSendReviewButtonRequestsCount,
        (
            _state,
            _accountKey: AccountKey,
            _tokenContract?: TokenAddress,
            precomposedForm?: FormState | null,
        ) => precomposedForm,
        selectSendPrecomposedTx,
        selectAccountByKey,
        selectSelectedDevice,
        selectIsTransactionAlreadySigned,
    ],
    (
        sendReviewButtonRequests,
        precomposedForm,
        precomposedTx,
        account,
        device,
        isTransactionAlreadySigned,
    ) => {
        if (!account || !device || !precomposedForm || !precomposedTx) {
            return null;
        }

        const decreaseOutputId = getDecreaseOutputId(precomposedTx, precomposedForm);

        const outputs = constructTransactionReviewOutputs({
            account,
            decreaseOutputId,
            device,
            precomposedForm,
            precomposedTx,
        });

        const newFlowOutputs = getIsUpdatedSendFlow(device)
            ? outputs
            : outputs?.filter(output => output.type !== 'fee'); // The `fee` output is already included in the final transaction summary output.

        return newFlowOutputs.map((output, outputIndex) => {
            const outputState: TransactionReviewOutputState = isTransactionAlreadySigned
                ? 'success'
                : getTransactionReviewOutputState(outputIndex, sendReviewButtonRequests);

            return { ...output, state: outputState } satisfies TransactionReviewStatefulOutput;
        });
    },
);

export const selectFormDraftByPrefix = (
    state: TransactionReviewOutputsState,
    prefix: FormDraftWithSendKeyPrefix,
    accountKey: AccountKey,
    tokenContract?: TokenAddress,
) =>
    prefix === 'send'
        ? selectSendFormDraftByKey(state, accountKey, tokenContract)
        : selectFormDraft<FormState>(
              state,
              getFormDraftKey(prefix, isStakingPrefix(prefix) ? accountKey : ''),
          );

export const selectTransactionReviewOutputsFromDraft = (
    state: TransactionReviewOutputsState,
    prefix: FormDraftWithSendKeyPrefix,
    accountKey: AccountKey,
    tokenContract?: TokenAddress,
) => {
    const formDraft = selectFormDraftByPrefix(state, prefix, accountKey, tokenContract);

    return selectTransactionReviewOutputs(state, accountKey, tokenContract, formDraft);
};

export const selectTransactionReviewOutputsFromPrecomposedForm = (
    state: TransactionReviewOutputsState,
    accountKey: AccountKey,
) => selectTransactionReviewOutputs(state, accountKey, undefined, selectPrecomposedSendForm(state));

export const selectIsTransactionReviewInProgress = (
    state: TransactionReviewOutputsState,
    prefix: FormDraftWithSendKeyPrefix,
    accountKey: AccountKey,
    tokenContract?: TokenAddress,
) => {
    const outputs = selectTransactionReviewOutputsFromDraft(
        state,
        prefix,
        accountKey,
        tokenContract,
    );

    return isNotNullOrUndefined(outputs) && A.isNotEmpty(outputs);
};

export const selectIsDestinationTagOutputConfirmed = (
    state: TransactionReviewOutputsState,
    prefix: FormDraftWithSendKeyPrefix,
    accountKey: AccountKey,
    tokenContract?: TokenAddress,
) => {
    const outputs = selectTransactionReviewOutputsFromDraft(
        state,
        prefix,
        accountKey,
        tokenContract,
    );
    if (!outputs) {
        return false;
    }

    return pipe(
        outputs,
        A.find(output => output.type === 'destination-tag' && output.state === 'success'),
        isNotNullOrUndefined,
    );
};

export const selectIsReceiveAddressOutputConfirmed = (
    state: TransactionReviewOutputsState,
    prefix: FormDraftWithSendKeyPrefix,
    accountKey: AccountKey,
    tokenContract?: TokenAddress,
) => {
    const outputs = selectTransactionReviewOutputsFromDraft(
        state,
        prefix,
        accountKey,
        tokenContract,
    );
    if (!outputs) {
        return false;
    }

    return pipe(
        outputs,
        A.find(
            output =>
                // 'regular_legacy' is address of BTC accounts used in older firmware versions.
                (output.type === 'address' || output.type === 'regular_legacy') &&
                output.state === 'success',
        ),
        isNotNullOrUndefined,
    );
};

const selectReviewSummaryOutputFromForm = createSendMemoizedSelector(
    [
        selectSendPrecomposedTx,
        selectIsTransactionAlreadySigned,
        (
            state: TransactionReviewOutputsState,
            accountKey: AccountKey,
            precomposedForm: FormState | null | undefined,
        ) => selectTransactionReviewOutputs(state, accountKey, undefined, precomposedForm),
    ],
    (precomposedTx, isTransactionAlreadySigned, reviewOutputs) => {
        if (!precomposedTx) {
            return null;
        }

        const { totalSpent, fee } = precomposedTx;

        if (isTransactionAlreadySigned) {
            return { state: 'success', totalSpent, fee } satisfies TransactionReviewSummaryOutput;
        }

        if (reviewOutputs && A.all(reviewOutputs, output => output.state === 'success')) {
            return { state: 'active', totalSpent, fee } satisfies TransactionReviewSummaryOutput;
        }

        return { state: undefined, totalSpent, fee } satisfies TransactionReviewSummaryOutput;
    },
);

export const selectReviewSummaryOutput = (
    state: TransactionReviewOutputsState,
    prefix: FormDraftWithSendKeyPrefix,
    accountKey: AccountKey,
    tokenContract?: TokenAddress,
) =>
    selectReviewSummaryOutputFromForm(
        state,
        accountKey,
        selectFormDraftByPrefix(state, prefix, accountKey, tokenContract),
    );

export const selectReviewSummaryOutputFromPrecomposedForm = (
    state: TransactionReviewOutputsState,
    accountKey: AccountKey,
) => selectReviewSummaryOutputFromForm(state, accountKey, selectPrecomposedSendForm(state));

export const selectIsClearSignedTradingSwap = createSendMemoizedSelector(
    [selectAccountByKey, selectSelectedDevice, selectPrecomposedSendForm, selectSendPrecomposedTx],
    (account, device, precomposedForm, precomposedTx) => {
        if (account && device && precomposedForm && precomposedTx) {
            return isClearSignedEvmTradingSwapTransaction({
                account,
                device,
                precomposedTx,
                transactionData: precomposedForm.transactionData,
                trading: precomposedForm.trading,
            });
        }

        return false;
    },
);
