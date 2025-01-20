import { Protocol } from '@suite-common/suite-constants';
import { getNetworkSymbolForProtocol } from '@suite-common/suite-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import * as walletConnectActions from '@suite-common/walletconnect';
import { SUITE_BRIDGE_DEEPLINK, SUITE_WALLETCONNECT_DEEPLINK } from '@trezor/urls';

import * as routerActions from 'src/actions/suite/routerActions';
import type { SendFormState } from 'src/reducers/suite/protocolReducer';
import type { Dispatch } from 'src/types/suite';
import { parseUri } from 'src/utils/suite/parseUri';
import { CoinProtocolInfo, getProtocolInfo } from 'src/utils/suite/protocol';

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

const saveCoinProtocol = (scheme: Protocol, address: string, amount?: number): ProtocolAction => ({
    type: PROTOCOL.SAVE_COIN_PROTOCOL,
    payload: { scheme, address, amount },
});

export const handleProtocolRequest = (uri: string) => (dispatch: Dispatch) => {
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
        const parsedUri = parseUri(uri);
        const wcUri = parsedUri?.searchParams?.get('uri');
        if (wcUri) {
            dispatch(walletConnectActions.walletConnectPairThunk({ uri: wcUri }));
        }
    }
};

export const resetProtocol = (): ProtocolAction => ({
    type: PROTOCOL.RESET,
});
