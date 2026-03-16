import { G } from '@mobily/ts-belt';

import { type DeviceRootState, selectDeviceButtonRequestsCodes } from '@suite-common/device';
import { type NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import {
    type AccountKey,
    type FormState,
    type Output,
    type TokenAddress,
} from '@suite-common/wallet-types';
import { getSendFormDraftKey } from '@suite-common/wallet-utils';

import { type SendRootState } from './sendFormReducer';

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

export const selectSendFormButtonRequestCodes = (state: DeviceRootState, symbol: NetworkSymbol) => {
    const buttonRequestCodes = selectDeviceButtonRequestsCodes(state);

    const networkType = getNetworkType(symbol);

    const isCardano = networkType === 'cardano';
    const isEthereum = networkType === 'ethereum';
    const isStellar = networkType === 'stellar';

    return buttonRequestCodes.filter(
        code =>
            code === 'ButtonRequest_ConfirmOutput' ||
            code === 'ButtonRequest_SignTx' ||
            isCardano ||
            (isEthereum && code === 'ButtonRequest_Other') ||
            // This is a special case for T1B1 devices (Stellar).
            // See https://github.com/trezor/trezor-firmware/issues/5120
            (isStellar && (code === 'ButtonRequest_Other' || code === 'ButtonRequest_ProtectCall')),
    );
};

export const selectSendFormReviewButtonRequestsCount = (
    state: DeviceRootState,
    symbol?: NetworkSymbol,
    decreaseOutputId?: number,
) => {
    if (symbol === undefined) return 0;

    const networkType = getNetworkType(symbol);
    const isCardano = networkType === 'cardano';

    const sendFormReviewRequest = selectSendFormButtonRequestCodes(state, symbol);

    // While confirming decrease amount in RBF, 'ButtonRequest_ConfirmOutput' is called twice (confirm decrease address, confirm decrease amount).
    if (
        G.isNumber(decreaseOutputId) &&
        sendFormReviewRequest.filter(code => code === 'ButtonRequest_ConfirmOutput').length > 1
    ) {
        sendFormReviewRequest.splice(-1, 1);
    }

    return isCardano ? sendFormReviewRequest.length - 1 : sendFormReviewRequest.length;
};

export const selectSendFormReviewLastButtonCode = (
    state: DeviceRootState,
    symbol?: NetworkSymbol,
) => {
    if (symbol === undefined) return null;

    const sendFormReviewRequest = selectSendFormButtonRequestCodes(state, symbol);

    // Return the last button request code from the filtered list
    return sendFormReviewRequest[sendFormReviewRequest.length - 1] ?? null;
};
