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
import { notificationsActions } from '@suite-common/toast-notifications';
import { parseTransferUri } from '@suite-common/transfer-uri';
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
    amount?: string,
    token?: string,
    tokenAmount?: string,
): ProtocolAction => ({
    type: PROTOCOL.SAVE_COIN_PROTOCOL,
    payload: { scheme, address, amount, token, tokenAmount },
});

export const handleProtocolRequest =
    (uri: string) => (dispatch: Dispatch, _getState: GetState, extra: ExtraDependencies) => {
        const result = parseTransferUri(uri);

        let scheme: string | undefined;
        if (result.success) {
            scheme = result.payload.scheme;
        } else if (result.error.type === 'UNKNOWN_SCHEME') {
            scheme = result.error.scheme;
        }

        // Report for any URI carrying a recognizable scheme (incl. unknown-protocol deeplinks).
        if (scheme !== undefined) {
            const isAmountPresent =
                result.success &&
                ((result.payload.format === 'bip321' && result.payload.amount !== undefined) ||
                    (result.payload.format === 'erc681' &&
                        result.payload.tokenAmount !== undefined));

            asTypedDesktopAnalytics(extra.services.analytics).report({
                type: events.appUriHandlerEvent.name,
                payload: { scheme, isAmountPresent },
            });
        }

        if (result.success) {
            const info = result.payload;
            const amount = info.format === 'bip321' ? info.amount : undefined;
            const token = info.format === 'erc681' ? info.token : undefined;
            const tokenAmount = info.format === 'erc681' ? info.tokenAmount : undefined;

            dispatch(saveCoinProtocol(info.scheme, info.address, amount, token, tokenAmount));
            dispatch(
                notificationsActions.addToast({
                    type: 'coin-scheme-protocol',
                    address: info.address,
                    scheme: info.scheme,
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
                    mapAnchorToRoute[domain?.replace(/^@/, '') as AnchorSettingSection];
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
