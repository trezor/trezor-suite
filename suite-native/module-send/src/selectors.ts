import { A, G, pipe } from '@mobily/ts-belt';

import {
    SendRootState,
    AccountsRootState,
    DeviceRootState,
    selectAccountByKey,
    selectDevice,
    selectSendPrecomposedTx,
    selectSendFormDraftByKey,
    selectSendFormReviewButtonRequestsCount,
    selectSendSerializedTx,
} from '@suite-common/wallet-core';
import {
    constructTransactionReviewOutputs,
    getIsUpdatedSendFlow,
    getTransactionReviewOutputState,
    isRbfTransaction,
} from '@suite-common/wallet-utils';
import { AccountKey, ReviewOutputState, TokenAddress } from '@suite-common/wallet-types';

import { StatefulReviewOutput } from './types';

export const selectTransactionReviewOutputs = (
    state: SendRootState & AccountsRootState & DeviceRootState,
    accountKey: AccountKey,
    tokenContract?: TokenAddress,
): StatefulReviewOutput[] | null => {
    const precomposedForm = selectSendFormDraftByKey(state, accountKey, tokenContract);
    const precomposedTx = selectSendPrecomposedTx(state);

    const decreaseOutputId =
        precomposedTx !== undefined && isRbfTransaction(precomposedTx) && precomposedTx.useNativeRbf
            ? precomposedForm?.setMaxOutputId
            : undefined;

    const account = selectAccountByKey(state, accountKey);
    const device = selectDevice(state);

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
                state: getTransactionReviewOutputState(outputIndex, sendReviewButtonRequests),
            }) as StatefulReviewOutput,
    );
};

export const selectIsTransactionReviewInProgress = (
    state: SendRootState & AccountsRootState & DeviceRootState,
    accountKey: AccountKey,
    tokenContract?: TokenAddress,
): boolean => {
    const outputs = selectTransactionReviewOutputs(state, accountKey, tokenContract);

    return G.isNotNullable(outputs) && A.isNotEmpty(outputs);
};

export const selectIsDestinationTagOutputConfirmed = (
    state: SendRootState & AccountsRootState & DeviceRootState,
    accountKey: AccountKey,
    tokenContract?: TokenAddress,
): boolean => {
    const outputs = selectTransactionReviewOutputs(state, accountKey, tokenContract);
    if (!outputs) return false;

    return pipe(
        outputs,
        A.find(output => output.type === 'destination-tag' && output.state === 'success'),
        G.isNotNullable,
    );
};

export const selectIsReceiveAddressOutputConfirmed = (
    state: SendRootState & AccountsRootState & DeviceRootState,
    accountKey: string,
    tokenContract?: TokenAddress,
): boolean => {
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
};

export const selectIsTransactionAlreadySigned = (state: SendRootState) => {
    const serializedTx = selectSendSerializedTx(state);

    return G.isNotNullable(serializedTx);
};

export const selectReviewSummaryOutputState = (
    state: SendRootState & AccountsRootState & DeviceRootState,
    accountKey: AccountKey,
    tokenContract?: TokenAddress,
): ReviewOutputState => {
    const isTransactionAlreadySigned = selectIsTransactionAlreadySigned(state);

    if (isTransactionAlreadySigned) {
        return 'success';
    }

    const reviewOutputs = selectTransactionReviewOutputs(state, accountKey, tokenContract);

    if (reviewOutputs && A.all(reviewOutputs, output => output.state === 'success')) {
        return 'active';
    }

    return undefined;
};

export const selectReviewSummaryOutput = (
    state: AccountsRootState & DeviceRootState & SendRootState,
    accountKey: AccountKey,
    tokenContract?: TokenAddress,
) => {
    const precomposedTx = selectSendPrecomposedTx(state);

    if (!precomposedTx) return null;

    const { totalSpent, fee } = precomposedTx;

    const outputState = selectReviewSummaryOutputState(state, accountKey, tokenContract);

    return {
        state: outputState,
        totalSpent,
        fee,
    };
};

export const selectTransactionReviewActiveStepIndex = (
    state: AccountsRootState & DeviceRootState & SendRootState,
    accountKey: AccountKey,
    tokenContract?: TokenAddress,
) => {
    const reviewOutputs = selectTransactionReviewOutputs(state, accountKey, tokenContract);

    if (!reviewOutputs) return 0;

    const activeIndex = reviewOutputs.findIndex(output => output.state === 'active');

    return activeIndex === -1 ? reviewOutputs.length : activeIndex;
};
