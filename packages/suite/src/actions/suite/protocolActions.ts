import { Protocol } from '@suite-common/suite-constants';
import { getNetworkSymbolForProtocol } from '@suite-common/suite-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import * as walletConnectActions from '@suite-common/walletconnect';
import {
    SUITE_ANCHOR_DEEPLINK_PREFIX,
    SUITE_BRIDGE_DEEPLINK,
    SUITE_WALLETCONNECT_DEEPLINK,
} from '@trezor/urls';
import { isArrayMember } from '@trezor/utils';

import * as routerActions from 'src/actions/suite/routerActions';
import { goto } from 'src/actions/suite/routerActions';
import type { SendFormState } from 'src/reducers/suite/protocolReducer';
import { selectIsDebugModeActive } from 'src/reducers/suite/suiteReducer';
import { Dispatch, GetState } from 'src/types/suite';
import { parseUri } from 'src/utils/suite/parseUri';
import { CoinProtocolInfo, getProtocolInfo } from 'src/utils/suite/protocol';

import { PROTOCOL } from './constants';
import {
    AnchorSettingSection,
    SettingsAnchor,
    mapAnchorToRoute,
} from '../../constants/suite/anchors';

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

const saveCoinProtocol = (scheme: Protocol, address: string, amount?: number): ProtocolAction => ({
    type: PROTOCOL.SAVE_COIN_PROTOCOL,
    payload: { scheme, address, amount },
});

export const handleProtocolRequest = (uri: string) => (dispatch: Dispatch, getState: GetState) => {
    const protocol = getProtocolInfo(uri);

    if (protocol && !('error' in protocol) && getNetworkSymbolForProtocol(protocol.scheme)) {
        const { scheme, amount, address } = protocol as CoinProtocolInfo;

        dispatch(saveCoinProtocol(scheme, address, amount));
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
        dispatch(routerActions.goto('suite-bridge-requested', { params: { cancelable: true } }));
    } else if (uri?.startsWith(SUITE_WALLETCONNECT_DEEPLINK)) {
        // This feature is currently only available in debug mode
        const isDebug = selectIsDebugModeActive(getState());
        if (!isDebug) return;

        const parsedUri = parseUri(uri);
        const wcUri = parsedUri?.searchParams?.get('uri');
        if (wcUri) {
            dispatch(walletConnectActions.walletConnectPairThunk({ uri: wcUri }));
        }
    } else if (uri?.startsWith(SUITE_ANCHOR_DEEPLINK_PREFIX)) {
        const anchor = uri.replace(SUITE_ANCHOR_DEEPLINK_PREFIX, '');

        if (isArrayMember(anchor, Object.values(SettingsAnchor))) {
            const [domain] = anchor.split('/');

            const targetRoute = mapAnchorToRoute[domain.replace(/^@/, '') as AnchorSettingSection];
            dispatch(goto(targetRoute, { anchor }));
        }
    }
};

export const resetProtocol = (): ProtocolAction => ({
    type: PROTOCOL.RESET,
});
