import { G } from '@mobily/ts-belt';

import { type NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import { AccountKey, FormState, Output, TokenAddress } from '@suite-common/wallet-types';
import { getSendFormDraftKey } from '@suite-common/wallet-utils';

import { SendRootState } from './sendFormReducer';
import { DeviceRootState } from '../device/deviceReducer';
import { selectDeviceButtonRequestsCodes } from '../device/deviceSelectors';

export const selectSendPrecomposedTx = (state: SendRootState) => state.wallet.send.precomposedTx;
export const selectSendSerializedTx = (state: SendRootState) => state.wallet.send.serializedTx;
export const selectSendSignedTx = (state: SendRootState) => state.wallet.send.signedTx;
export const selectSendFormDrafts = (state: SendRootState) => state.wallet.send.drafts;
export const selectPrecomposedSendForm = (state: SendRootState) =>
    state.wallet.send.precomposedForm;

export const selectSendFormDraftByKey = (
    state: SendRootState,
    accountKey?: AccountKey,
    tokenContract?: TokenAddress,
): FormState | null => {
    if (G.isUndefined(accountKey)) return null;

    return state.wallet.send.drafts[getSendFormDraftKey(accountKey, tokenContract)] ?? null;
};

export const selectSendFormDraftOutputsByAccountKey = (
    state: SendRootState,
    accountKey?: AccountKey,
    tokenContract?: TokenAddress,
): Output[] | null => {
    if (G.isUndefined(accountKey)) return null;

    const draft = selectSendFormDraftByKey(state, accountKey, tokenContract);

    return draft?.outputs ?? null;
};

export const selectSendFormReviewButtonRequestsCount = (
    state: DeviceRootState,
    symbol?: NetworkSymbol,
    decreaseOutputId?: number,
) => {
    const buttonRequestCodes = selectDeviceButtonRequestsCodes(state);

    if (G.isNullable(symbol)) return 0;

    const networkType = getNetworkType(symbol);

    const isCardano = networkType === 'cardano';
    const isEthereum = networkType === 'ethereum';

    const sendFormReviewRequest = buttonRequestCodes.filter(
        code =>
            code === 'ButtonRequest_ConfirmOutput' ||
            code === 'ButtonRequest_SignTx' ||
            isCardano ||
            (isEthereum && code === 'ButtonRequest_Other'),
    );

    // While confirming decrease amount in RBF, 'ButtonRequest_ConfirmOutput' is called twice (confirm decrease address, confirm decrease amount).
    if (
        G.isNumber(decreaseOutputId) &&
        sendFormReviewRequest.filter(code => code === 'ButtonRequest_ConfirmOutput').length > 1
    ) {
        sendFormReviewRequest.splice(-1, 1);
    }

    return isCardano ? sendFormReviewRequest.length - 1 : sendFormReviewRequest.length;
};
