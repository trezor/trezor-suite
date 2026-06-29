import {
    type AnchorSettingSection,
    SettingsAnchor,
    goto,
    mapAnchorToRoute,
    onLocationChange,
} from '@suite/router';
import { type CoinProtocol, handleCoinProtocolUri } from '@suite/transfer-uri';
import { type ExtraDependencies } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import * as walletConnectActions from '@suite-common/walletconnect';
import {
    SUITE_ANCHOR_DEEPLINK_PREFIX,
    SUITE_BRIDGE_DEEPLINK,
    SUITE_TRADING_REDIRECT_DEEPLINKS,
    SUITE_WALLETCONNECT_DEEPLINK,
} from '@trezor/urls';
import { isArrayMember, safeParseUrl } from '@trezor/utils';

import type { SendFormState } from 'src/reducers/suite/protocolReducer';
import { asSuiteServices } from 'src/support/extraDependencies';
import { type Dispatch, type GetState } from 'src/types/suite';

import { PROTOCOL } from './constants';

export type ProtocolAction =
    | {
          type: typeof PROTOCOL.FILL_SEND_FORM;
          payload: boolean;
      }
    | {
          type: typeof PROTOCOL.SAVE_COIN_PROTOCOL;
          payload: SendFormState;
      }
    | { type: typeof PROTOCOL.RESET };

export const fillSendForm = (shouldFill: boolean): ProtocolAction => ({
    type: PROTOCOL.FILL_SEND_FORM,
    payload: shouldFill,
});

const saveCoinProtocol = (coinProtocol: CoinProtocol): ProtocolAction => ({
    type: PROTOCOL.SAVE_COIN_PROTOCOL,
    payload: coinProtocol,
});

export const handleProtocolRequest =
    (uri: string) => (dispatch: Dispatch, _getState: GetState, extra: ExtraDependencies) => {
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
                    asSuiteServices(extra.services).suiteRouterHistory.navigate(path);
                    dispatch(onLocationChange(path));
                }
            }
        }
    };

export const resetProtocol = (): ProtocolAction => ({
    type: PROTOCOL.RESET,
});
