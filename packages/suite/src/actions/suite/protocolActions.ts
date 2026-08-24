import { type UnknownAction, createAction } from '@reduxjs/toolkit';
import { type ThunkDispatch } from 'redux-thunk';

import type { DesktopAnalyticsDep } from '@suite/analytics';
import {
    type AnchorSettingSection,
    type GotoThunkState,
    SettingsAnchor,
    type SuiteRouterHistoryDep,
    goto,
    mapAnchorToRoute,
    onLocationChange,
} from '@suite/router';
import { handleCoinProtocolUri } from '@suite/transfer-uri';
import type { FindNetworkSymbolForProtocolDep } from '@suite-common/networks';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    type WalletConnectInitThunkDeps,
    type WalletConnectInitThunkState,
} from '@suite-common/walletconnect';
import * as walletConnectActions from '@suite-common/walletconnect';
import {
    SUITE_ANCHOR_DEEPLINK_PREFIX,
    SUITE_BRIDGE_DEEPLINK,
    SUITE_TRADING_REDIRECT_DEEPLINKS,
    SUITE_WALLETCONNECT_DEEPLINK,
} from '@trezor/urls';
import { isArrayMember, safeParseUrl } from '@trezor/utils';

import type { SendFormState } from 'src/reducers/suite/protocolReducer';

import { PROTOCOL } from './constants';

export const saveCoinProtocol = createAction(
    PROTOCOL.SAVE_COIN_PROTOCOL,
    (payload: SendFormState) => ({ payload }),
);

export const fillSendForm = createAction<boolean>(PROTOCOL.FILL_SEND_FORM);

export const resetProtocol = createAction(PROTOCOL.RESET);

export type HandleProtocolRequestDeps = {
    services: DesktopAnalyticsDep & FindNetworkSymbolForProtocolDep & SuiteRouterHistoryDep;
};

export type HandleProtocolRequestState = GotoThunkState & WalletConnectInitThunkState;
type HandleProtocolRequestDispatchDeps = HandleProtocolRequestDeps & WalletConnectInitThunkDeps;

export const handleProtocolRequest =
    (uri: string) =>
    (
        dispatch: ThunkDispatch<
            HandleProtocolRequestState,
            HandleProtocolRequestDispatchDeps,
            UnknownAction
        >,
        _getState: () => HandleProtocolRequestState,
        extra: HandleProtocolRequestDeps,
    ) => {
        dispatch(handleCoinProtocolUri(uri, saveCoinProtocol));

        if (uri?.startsWith(SUITE_BRIDGE_DEEPLINK)) {
            dispatch(goto({ routeName: 'suite-bridge-requested', params: { cancelable: true } }));
        } else if (uri?.startsWith(SUITE_WALLETCONNECT_DEEPLINK)) {
            const parsedUri = safeParseUrl(uri);
            const wcUri = parsedUri?.searchParams?.get('uri');
            if (wcUri) {
                dispatch(walletConnectActions.walletConnectPairThunk({ uri: wcUri }))
                    .unwrap()
                    .catch(error => {
                        dispatch(
                            notificationsActions.addToast({
                                type: 'error',
                                error: error.message,
                            }),
                        );
                    });
            }
        } else if (uri?.startsWith(SUITE_ANCHOR_DEEPLINK_PREFIX)) {
            const anchor = uri.replace(SUITE_ANCHOR_DEEPLINK_PREFIX, '');

            if (isArrayMember(anchor, Object.values(SettingsAnchor))) {
                const [domain] = anchor.split('/');

                const targetRoute =
                    mapAnchorToRoute[domain?.replace(/^@/, '') as AnchorSettingSection];
                dispatch(goto({ routeName: targetRoute, anchor }));
            }
        } else if (SUITE_TRADING_REDIRECT_DEEPLINKS.some(deeplink => uri?.startsWith(deeplink))) {
            const parsedUri = safeParseUrl(decodeURIComponent(uri));
            const redirectPath = parsedUri?.searchParams?.get('p');

            if (redirectPath) {
                const decodedPath = decodeURIComponent(redirectPath);
                const [, hash] = decodedPath.split('/coinmarket-redirect/');
                if (hash) {
                    const path = { pathname: '/coinmarket-redirect', hash: `#${hash}` } as const;
                    extra.services.suiteRouterHistory.navigate(path);
                    dispatch(onLocationChange(path));
                }
            }
        }
    };
