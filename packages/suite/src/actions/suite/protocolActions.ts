import { PROTOCOL } from './constants';
import { getProtocolInfo, isPaymentRequestProtocolScheme } from 'src/utils/suite/protocol';
import type { Dispatch } from 'src/types/suite';
import type { PROTOCOL_SCHEME } from 'src/constants/suite/protocol';
import type { SendFormState } from 'src/reducers/suite/protocolReducer';
import { notificationsActions } from '@suite-common/toast-notifications';
import * as routerActions from 'src/actions/suite/routerActions';

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
    scheme: PROTOCOL_SCHEME,
    address: string,
    amount?: number,
): ProtocolAction => ({
    type: PROTOCOL.SAVE_COIN_PROTOCOL,
    payload: { scheme, address, amount },
});

export const handleProtocolRequest = (uri: string) => (dispatch: Dispatch) => {
    const protocol = getProtocolInfo(uri);

    console.log('==== handle protocol request ====', protocol, uri);
    // bridge-requested-by-a-3rd-party
    if (protocol && isPaymentRequestProtocolScheme(protocol.scheme)) {
        const { scheme, amount, address } = protocol;

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
    } else if ('trezorsuite://bridge-requested-by-a-3rd-party') {
        console.log('uaaaaaaa');
        dispatch(routerActions.goto('suite-bridge-requested', { params: { cancelable: true } }));
    }
};

export const resetProtocol = (): ProtocolAction => ({
    type: PROTOCOL.RESET,
});
