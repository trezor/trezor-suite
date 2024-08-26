import { A, G } from '@mobily/ts-belt';

import {
    SendRootState,
    AccountsRootState,
    DeviceRootState,
    selectAccountByKey,
    selectDevice,
    selectSendPrecomposedTx,
    selectSendFormDraftByAccountKey,
    selectSendFormReviewButtonRequestsCount,
    selectSendSignedTx,
} from '@suite-common/wallet-core';
import {
    constructTransactionReviewOutputs,
    getTransactionReviewOutputState,
    isRbfTransaction,
} from '@suite-common/wallet-utils';
import { ReviewOutputState } from '@suite-common/wallet-types';

import { StatefulReviewOutput } from './types';

export const selectTransactionReviewOutputs = (
    state: SendRootState & AccountsRootState & DeviceRootState,
    accountKey: string,
): StatefulReviewOutput[] | null => {
    const precomposedForm = selectSendFormDraftByAccountKey(state, accountKey);
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

    return outputs?.map(
        (output, outputIndex) =>
            ({
                ...output,
                state: getTransactionReviewOutputState(outputIndex, sendReviewButtonRequests),
            }) as StatefulReviewOutput,
    );
};

export const selectIsOutputsReviewInProgress = (
    state: SendRootState & AccountsRootState & DeviceRootState,
    accountKey: string,
): boolean => {
    const outputs = selectTransactionReviewOutputs(state, accountKey);

    return G.isNotNullable(outputs) && A.isNotEmpty(outputs);
};

export const selectIsFirstTransactionAddressConfirmed = (
    state: SendRootState & AccountsRootState & DeviceRootState,
    accountKey: string,
): boolean => {
    const outputs = selectTransactionReviewOutputs(state, accountKey);

    return outputs?.[0].state === 'success';
};

export const selectReviewSummaryOutputState = (
    state: SendRootState & AccountsRootState & DeviceRootState,
    accountKey: string,
): ReviewOutputState => {
    const signedTx = selectSendSignedTx(state);

    if (signedTx) {
        return 'success';
    }

    const reviewOutputs = selectTransactionReviewOutputs(state, accountKey);

    if (reviewOutputs && A.all(reviewOutputs, output => output.state === 'success')) {
        return 'active';
    }

    return undefined;
};

export const selectReviewSummaryOutput = (
    state: AccountsRootState & DeviceRootState & SendRootState,
    accountKey: string,
) => {
    const precomposedTx = selectSendPrecomposedTx(state);

    if (!precomposedTx) return null;

    const { totalSpent, fee } = precomposedTx;

    const outputState = selectReviewSummaryOutputState(state, accountKey);

    return {
        state: outputState,
        totalSpent,
        fee,
    };
};

export const selectTransactionReviewActiveStepIndex = (
    state: AccountsRootState & DeviceRootState & SendRootState,
    accountKey: string,
) => {
    const reviewOutputs = selectTransactionReviewOutputs(state, accountKey);

    if (!reviewOutputs) return 0;

    const activeIndex = reviewOutputs.findIndex(output => output.state === 'active');

    return activeIndex === -1 ? reviewOutputs.length : activeIndex;
};
