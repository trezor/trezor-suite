import { type Dispatch, type UnknownAction } from '@reduxjs/toolkit';

import { type DesktopAnalyticsDep, events } from '@suite/analytics';
import type { FindNetworkSymbolForProtocolDep } from '@suite-common/networks';
import { notificationsActions } from '@suite-common/toast-notifications';
import { isAmountPresent, parseTransferUri } from '@suite-common/transfer-uri';
import type { Protocol } from '@trezor/network-module-suite-common-types';

/** Flat transfer fields, matching the send-form state the protocol reducer persists. */
export type CoinProtocol = {
    scheme: Protocol;
    address: string;
    amount?: string;
    label?: string;
    token?: string;
    tokenAmount?: string;
};

type SaveCoinProtocol = (coinProtocol: CoinProtocol) => UnknownAction;

export type HandleCoinProtocolUriDeps = {
    services: FindNetworkSymbolForProtocolDep & DesktopAnalyticsDep;
};

/**
 * Fire-and-forget thunk for an incoming transfer URI: decode it, report any
 * recognizable scheme, and for a valid transfer save it + toast the user.
 *
 * The protocol send-form reducer lives in the app, so its `saveCoinProtocol`
 * action is injected to keep this package free of an app import cycle.
 */
export const handleCoinProtocolUri =
    (uri: string, saveCoinProtocol: SaveCoinProtocol) =>
    (dispatch: Dispatch, _getState: unknown, extra: HandleCoinProtocolUriDeps) => {
        // Report any URI carrying a recognizable scheme (incl. unknown-protocol deeplinks).
        const reportScheme = (scheme: string, amountPresent: boolean) =>
            extra.services.analytics.report({
                type: events.appUriHandlerEvent.name,
                payload: { scheme, isAmountPresent: amountPresent },
            });

        const result = parseTransferUri(uri, extra.services.findNetworkSymbolForProtocol);

        if (!result.success) {
            if (result.error.type === 'UNKNOWN_SCHEME') reportScheme(result.error.scheme, false);

            return;
        }

        const info = result.payload;
        const coinProtocol: CoinProtocol = {
            scheme: info.scheme,
            address: info.address,
            amount: info.format === 'bip321' ? info.amount : undefined,
            label: info.format === 'bip321' ? info.label : undefined,
            token: info.format === 'erc681' ? info.token : undefined,
            tokenAmount: info.format === 'erc681' ? info.tokenAmount : undefined,
        };

        reportScheme(info.scheme, isAmountPresent(info));

        dispatch(saveCoinProtocol(coinProtocol));
        dispatch(
            notificationsActions.addToast({
                type: 'coin-scheme-protocol',
                address: coinProtocol.address,
                scheme: coinProtocol.scheme,
                amount: coinProtocol.amount,
                autoClose: false,
            }),
        );
    };
