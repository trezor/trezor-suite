import { asTypedDesktopAnalytics, events } from '@suite/analytics';
import {
    type AnchorSettingSection,
    SettingsAnchor,
    goto,
    mapAnchorToRoute,
    onLocationChange,
} from '@suite/router';
import { type ExtraDependencies } from '@suite-common/redux-utils';
import { type Protocol } from '@suite-common/suite-constants';
import { getNetworkSymbolForProtocol } from '@suite-common/suite-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import * as walletConnectActions from '@suite-common/walletconnect';
import {
    SUITE_ANCHOR_DEEPLINK_PREFIX,
    SUITE_BRIDGE_DEEPLINK,
    SUITE_TRADING_REDIRECT_DEEPLINKS,
    SUITE_WALLETCONNECT_DEEPLINK,
} from '@trezor/urls';
import { isArrayMember } from '@trezor/utils';

import type { SendFormState } from 'src/reducers/suite/protocolReducer';
import { asSuiteServices } from 'src/support/extraDependencies';
import { type Dispatch, type GetState } from 'src/types/suite';
import { parseUri } from 'src/utils/suite/parseUri';
import { type CoinProtocolInfo, getProtocolInfo } from 'src/utils/suite/protocol';

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

const saveCoinProtocol = (
    scheme: Protocol,
    address: string,
    amount?: number,
    token?: string,
    tokenAmount?: string,
): ProtocolAction => ({
    type: PROTOCOL.SAVE_COIN_PROTOCOL,
    payload: { scheme, address, amount, token, tokenAmount },
});

export const handleProtocolRequest =
    (uri: string) => (dispatch: Dispatch, _getState: GetState, extra: ExtraDependencies) => {
        const protocol = getProtocolInfo(uri);

        if (protocol) {
            asTypedDesktopAnalytics(extra.services.analytics).report({
                type: events.appUriHandlerEvent.name,
                payload: {
                    scheme: protocol.scheme,
                    isAmountPresent:
                        ('amount' in protocol && protocol.amount !== undefined) ||
                        ('tokenAmount' in protocol && protocol.tokenAmount !== undefined),
                },
            });
        }

        if (protocol && !('error' in protocol) && getNetworkSymbolForProtocol(protocol.scheme)) {
            const { scheme, amount, address, token, tokenAmount } = protocol as CoinProtocolInfo;

            dispatch(saveCoinProtocol(scheme, address, amount, token, tokenAmount));
            dispatch(
                notificationsActions.addToast({
                    type: 'coin-scheme-protocol',
                    address,
                    scheme,
                    amount,
                    autoClose: false,
                }),
            );
        } else if (uri?.startsWith(SUITE_BRIDGE_DEEPLINK)) {
            dispatch(goto({ routeName: 'suite-bridge-requested', params: { cancelable: true } }));
        } else if (uri?.startsWith(SUITE_WALLETCONNECT_DEEPLINK)) {
            const parsedUri = parseUri(uri);
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
                    mapAnchorToRoute[domain.replace(/^@/, '') as AnchorSettingSection];
                dispatch(goto({ routeName: targetRoute, anchor }));
            }
        } else if (SUITE_TRADING_REDIRECT_DEEPLINKS.some(deeplink => uri?.startsWith(deeplink))) {
            const parsedUri = parseUri(decodeURIComponent(uri));
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
