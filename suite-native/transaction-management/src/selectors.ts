import { A, pipe } from '@mobily/ts-belt';

import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { createWeakMapSelector } from '@suite-common/redux-utils';
import {
    type AccountsRootState,
    type FormDraftRootState,
    selectAccountByKey,
    selectFormDraft,
    selectSendFormDraftByKey,
    selectSendFormReviewButtonRequestsCount,
    selectSendPrecomposedTx,
    selectSendSerializedTx,
} from '@suite-common/wallet-core';
import {
    type AccountKey,
    type FeeLevelLabel,
    type FormDraftWithSendKeyPrefix,
    type FormState,
    type GeneralPrecomposedTransaction,
    type ReviewOutputState,
    type TokenAddress,
} from '@suite-common/wallet-types';
import {
    constructTransactionReviewOutputs,
    getFormDraftKey,
    getIsUpdatedSendFlow,
    getTransactionReviewOutputState,
    isFormDraftKeyPrefix,
    isRbfBumpFeeTransaction,
} from '@suite-common/wallet-utils';
import { BigNumber, isNotNullOrUndefined } from '@trezor/utils';

import { type NativeSendRootState } from './sendFormSlice';
import { type StatefulReviewOutput } from './types';

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

export const selectTransactionReviewOutputs = createSendMemoizedSelector(
    [
        state => state,
        (
            _state,
            _accountKey: string,
            _tokenContract?: TokenAddress,
            precomposedForm?: FormState | null,
        ) => precomposedForm,
        selectSendPrecomposedTx,
        selectAccountByKey,
        selectSelectedDevice,
        selectIsTransactionAlreadySigned,
    ],
    (state, precomposedForm, precomposedTx, account, device, isTransactionAlreadySigned) => {
        if (!account || !device || !precomposedForm || !precomposedTx) {
            return null;
        }

        const decreaseOutputId =
            isRbfBumpFeeTransaction(precomposedTx) && precomposedTx.useNativeRbf
                ? precomposedForm?.setMaxOutputId
                : undefined;

        const sendReviewButtonRequests = selectSendFormReviewButtonRequestsCount(
            state,
            account?.symbol,
            decreaseOutputId,
        );

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

        return newFlowOutputs.map(
            (output, outputIndex) =>
                ({
                    ...output,
                    state: isTransactionAlreadySigned
                        ? 'success'
                        : getTransactionReviewOutputState(outputIndex, sendReviewButtonRequests),
                }) as StatefulReviewOutput,
        );
    },
);

export const selectTransactionReviewOutputsFromDraft = (
    state: TransactionReviewOutputsState,
    prefix: FormDraftWithSendKeyPrefix,
    accountKey: AccountKey,
    tokenContract?: TokenAddress,
) => {
    const formDraft = isFormDraftKeyPrefix(prefix)
        ? // TODO: right now we do not use account key in trading-exchange for drafts
          // and this piece of code is not used anywhere else
          selectFormDraft<FormState>(state, getFormDraftKey(prefix, ''))
        : selectSendFormDraftByKey(state, accountKey, tokenContract);

    return selectTransactionReviewOutputs(state, accountKey, tokenContract, formDraft);
};

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

export const selectReviewSummaryOutputState = (
    state: TransactionReviewOutputsState,
    prefix: FormDraftWithSendKeyPrefix,
    accountKey: AccountKey,
    tokenContract?: TokenAddress,
) => {
    const isTransactionAlreadySigned = selectIsTransactionAlreadySigned(state);

    if (isTransactionAlreadySigned) {
        return 'success';
    }

    const reviewOutputs = selectTransactionReviewOutputsFromDraft(
        state,
        prefix,
        accountKey,
        tokenContract,
    );

    if (reviewOutputs && A.all(reviewOutputs, output => output.state === 'success')) {
        return 'active';
    }

    return undefined;
};

export const selectReviewSummaryOutput = createSendMemoizedSelector(
    [selectSendPrecomposedTx, selectReviewSummaryOutputState],
    (precomposedTx, outputState) => {
        if (!precomposedTx) {
            return null;
        }

        return {
            state: outputState as ReviewOutputState,
            totalSpent: precomposedTx.totalSpent,
            fee: precomposedTx.fee,
        };
    },
);

export const selectTransactionReviewActiveStepIndex = (
    state: TransactionReviewOutputsState,
    prefix: FormDraftWithSendKeyPrefix,
    accountKey: AccountKey,
    tokenContract?: TokenAddress,
) => {
    const reviewOutputs = selectTransactionReviewOutputsFromDraft(
        state,
        prefix,
        accountKey,
        tokenContract,
    );

    if (!reviewOutputs) {
        return 0;
    }

    const activeIndex = reviewOutputs.findIndex(output => output.state === 'active');

    return activeIndex === -1 ? reviewOutputs.length : activeIndex;
};
