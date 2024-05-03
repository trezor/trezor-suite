import {
    SendRootState,
    AccountsRootState,
    DeviceRootState,
    selectAccountByKey,
    selectDevice,
    selectPrecomposedSendForm,
    selectSendPrecomposedTx,
    selectSendFormReviewButtonRequestsCount,
} from '@suite-common/wallet-core';
import { constructOutputs, getOutputState } from '@suite-common/wallet-utils';

import { StatefulReviewOutput } from './types';

export const selectTransactionReviewOutputs = (
    state: SendRootState & AccountsRootState & DeviceRootState,
    accountKey: string,
): StatefulReviewOutput[] | null => {
    const precomposedForm = selectPrecomposedSendForm(state);
    const precomposedTx = selectSendPrecomposedTx(state);

    const decreaseOutputId = precomposedTx?.useNativeRbf
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

    const outputs = constructOutputs({
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
                state: getOutputState(outputIndex, sendReviewButtonRequests),
            }) as StatefulReviewOutput,
    );
};
