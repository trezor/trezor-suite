import { A, G, pipe } from '@mobily/ts-belt';

import { createWeakMapSelector } from '@suite-common/redux-utils';
import {
    AccountsRootState,
    DeviceRootState,
    SendRootState,
    selectAccountByKey,
    selectSelectedDevice,
    selectSendFormDraftByKey,
    selectSendFormReviewButtonRequestsCount,
    selectSendPrecomposedTx,
    selectSendSerializedTx,
} from '@suite-common/wallet-core';
import { AccountKey, ReviewOutputState, TokenAddress } from '@suite-common/wallet-types';
import {
    constructTransactionReviewOutputs,
    getIsUpdatedSendFlow,
    getTransactionReviewOutputState,
    isRbfBumpFeeTransaction,
} from '@suite-common/wallet-utils';

import { StatefulReviewOutput } from './types';

// Create memoized selector for complex computations
const createSendMemoizedSelector = createWeakMapSelector.withTypes<
    SendRootState & AccountsRootState & DeviceRootState
>();

export const selectIsTransactionAlreadySigned = (state: SendRootState) => {
    const serializedTx = selectSendSerializedTx(state);

    return G.isNotNullable(serializedTx);
};

export const selectTransactionReviewOutputs = createSendMemoizedSelector(
    [
        (state: SendRootState & AccountsRootState & DeviceRootState) => state,
        (_state, accountKey: AccountKey) => accountKey,
        (_state, _accountKey: AccountKey, tokenContract?: TokenAddress) => tokenContract,
    ],
    (state, accountKey, tokenContract) => {
        const precomposedForm = selectSendFormDraftByKey(state, accountKey, tokenContract);
        const precomposedTx = selectSendPrecomposedTx(state);

        const decreaseOutputId =
            precomposedTx !== undefined &&
            isRbfBumpFeeTransaction(precomposedTx) &&
            precomposedTx.useNativeRbf
                ? precomposedForm?.setMaxOutputId
                : undefined;

        const account = selectAccountByKey(state, accountKey);
        const device = selectSelectedDevice(state);

        const isTransactionAlreadySigned = selectIsTransactionAlreadySigned(state);

        const sendReviewButtonRequests = selectSendFormReviewButtonRequestsCount(
            state,
            account?.symbol,
            decreaseOutputId,
        );
        if (!account || !device || !precomposedForm || !precomposedTx) return null;

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

export const selectIsTransactionReviewInProgress = createSendMemoizedSelector(
    [
        (state: SendRootState & AccountsRootState & DeviceRootState) => state,
        (_state, accountKey: AccountKey) => accountKey,
        (_state, _accountKey: AccountKey, tokenContract?: TokenAddress) => tokenContract,
    ],
    (state, accountKey, tokenContract) => {
        const outputs = selectTransactionReviewOutputs(state, accountKey, tokenContract);

        return G.isNotNullable(outputs) && A.isNotEmpty(outputs);
    },
);

export const selectIsDestinationTagOutputConfirmed = createSendMemoizedSelector(
    [
        (state: SendRootState & AccountsRootState & DeviceRootState) => state,
        (_state, accountKey: AccountKey) => accountKey,
        (_state, _accountKey: AccountKey, tokenContract?: TokenAddress) => tokenContract,
    ],
    (state, accountKey, tokenContract) => {
        const outputs = selectTransactionReviewOutputs(state, accountKey, tokenContract);
        if (!outputs) return false;

        return pipe(
            outputs,
            A.find(output => output.type === 'destination-tag' && output.state === 'success'),
            G.isNotNullable,
        );
    },
);

export const selectIsReceiveAddressOutputConfirmed = createSendMemoizedSelector(
    [
        (state: SendRootState & AccountsRootState & DeviceRootState) => state,
        (_state, accountKey: string) => accountKey,
        (_state, _accountKey: string, tokenContract?: TokenAddress) => tokenContract,
    ],
    (state, accountKey, tokenContract) => {
        const outputs = selectTransactionReviewOutputs(state, accountKey, tokenContract);
        if (!outputs) return false;

        return pipe(
            outputs,
            A.find(
                output =>
                    // 'regular_legacy' is address of BTC accounts used in older firmware versions.
                    (output.type === 'address' || output.type === 'regular_legacy') &&
                    output.state === 'success',
            ),
            G.isNotNullable,
        );
    },
);

export const selectReviewSummaryOutputState = createSendMemoizedSelector(
    [
        (state: SendRootState & AccountsRootState & DeviceRootState) => state,
        (_state, accountKey: AccountKey) => accountKey,
        (_state, _accountKey: AccountKey, tokenContract?: TokenAddress) => tokenContract,
    ],
    (state, accountKey, tokenContract) => {
        const isTransactionAlreadySigned = selectIsTransactionAlreadySigned(state);

        if (isTransactionAlreadySigned) {
            return 'success';
        }

        const reviewOutputs = selectTransactionReviewOutputs(state, accountKey, tokenContract);

        if (reviewOutputs && A.all(reviewOutputs, output => output.state === 'success')) {
            return 'active';
        }

        return undefined;
    },
);

export const selectReviewSummaryOutput = createSendMemoizedSelector(
    [
        (state: AccountsRootState & DeviceRootState & SendRootState) => state,
        (_state, accountKey: AccountKey) => accountKey,
        (_state, _accountKey: AccountKey, tokenContract?: TokenAddress) => tokenContract,
    ],
    (state, accountKey, tokenContract) => {
        const precomposedTx = selectSendPrecomposedTx(state);

        if (!precomposedTx) return null;

        const { totalSpent, fee } = precomposedTx;

        const outputState = selectReviewSummaryOutputState(state, accountKey, tokenContract);

        return {
            state: outputState as ReviewOutputState,
            totalSpent,
            fee,
        };
    },
);

export const selectTransactionReviewActiveStepIndex = createSendMemoizedSelector(
    [
        (state: AccountsRootState & DeviceRootState & SendRootState) => state,
        (_state, accountKey: AccountKey) => accountKey,
        (_state, _accountKey: AccountKey, tokenContract?: TokenAddress) => tokenContract,
    ],
    (state, accountKey, tokenContract) => {
        const reviewOutputs = selectTransactionReviewOutputs(state, accountKey, tokenContract);

        if (!reviewOutputs) return 0;

        const activeIndex = reviewOutputs.findIndex(output => output.state === 'active');

        return activeIndex === -1 ? reviewOutputs.length : activeIndex;
    },
);
