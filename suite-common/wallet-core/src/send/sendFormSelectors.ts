import { G } from '@mobily/ts-belt';

import { type DeviceRootState, selectDeviceButtonRequests } from '@suite-common/device';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { type NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import {
    type AccountKey,
    type FormState,
    type Output,
    type TokenAddress,
} from '@suite-common/wallet-types';
import { getSendFormDraftKey } from '@suite-common/wallet-utils';

import { PAYMENT_REQUEST_BUTTON_NAMES } from './sendFormConstants';
import { type SendFormDrafts, type SendRootState } from './sendFormReducer';

const createMemoizedSelector = createWeakMapSelector.withTypes<DeviceRootState>();

export const selectSendPrecomposedTx = (state: SendRootState) => state.wallet.send.precomposedTx;
export const selectSend = (state: SendRootState) => state.wallet.send;
export const selectSendSerializedTx = (state: SendRootState) => state.wallet.send.serializedTx;
export const selectSendSignedTx = (state: SendRootState) => state.wallet.send.signedTx;
export const selectSendFormDrafts = (state: SendRootState): SendFormDrafts =>
    state.wallet.send.drafts;
export const selectSendFormAccountKey = (state: SendRootState) => state.wallet.send.accountKey;
export const selectSendRaw = (state: SendRootState) => state.wallet.send.sendRaw;
export const selectPrecomposedSendForm = (state: SendRootState) =>
    state.wallet.send.precomposedForm;
export const selectResolvedEthereumNonce = (state: SendRootState) =>
    state.wallet.send.resolvedEthereumNonce;

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

export const selectSendFormButtonRequestCodes = createMemoizedSelector(
    [selectDeviceButtonRequests, (_state: DeviceRootState, symbol: NetworkSymbol) => symbol],
    (buttonRequests, symbol) => {
        const networkType = getNetworkType(symbol);

        const isCardano = networkType === 'cardano';
        const isEthereum = networkType === 'ethereum';
        const isStellar = networkType === 'stellar';

        return returnStableArrayIfEmpty(
            buttonRequests
                .filter(
                    ({ code, name }) =>
                        code === 'ButtonRequest_ConfirmOutput' ||
                        code === 'ButtonRequest_SignTx' ||
                        isCardano ||
                        (isEthereum && code === 'ButtonRequest_Other') ||
                        (code === 'ButtonRequest_Other' &&
                            name !== undefined &&
                            PAYMENT_REQUEST_BUTTON_NAMES.includes(name)) ||
                        // This is a special case for T1B1 devices (Stellar).
                        // See https://github.com/trezor/trezor-firmware/issues/5120
                        (isStellar &&
                            (code === 'ButtonRequest_Other' ||
                                code === 'ButtonRequest_ProtectCall')),
                )
                .map(({ code }) => code),
        );
    },
);

export const selectSendFormReviewButtonRequestsCount = (
    state: DeviceRootState,
    symbol?: NetworkSymbol,
    decreaseOutputId?: number,
) => {
    if (symbol === undefined) return 0;

    const networkType = getNetworkType(symbol);
    const isCardano = networkType === 'cardano';

    const sendFormReviewRequest = selectSendFormButtonRequestCodes(state, symbol);

    let count = sendFormReviewRequest.length;

    // While confirming decrease amount in RBF, 'ButtonRequest_ConfirmOutput' is called twice (confirm decrease address, confirm decrease amount).
    // Drop one from the count (without mutating the memoized array).
    if (
        G.isNumber(decreaseOutputId) &&
        sendFormReviewRequest.filter(code => code === 'ButtonRequest_ConfirmOutput').length > 1
    ) {
        count -= 1;
    }

    return isCardano ? Math.max(0, count - 1) : count;
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
