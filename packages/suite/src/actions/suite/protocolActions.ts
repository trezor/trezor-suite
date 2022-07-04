import { PROTOCOL } from './constants';
import { getProtocolInfo, isProtocolScheme } from '@suite-utils/protocol';
import { addToast } from '@suite-actions/notificationActions';
import type { Dispatch } from '@suite-types';
import type { PROTOCOL_SCHEME } from '@suite-constants/protocol';
import type { SendFormState } from '@suite-reducers/protocolReducer';

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

    if (protocol && isProtocolScheme(protocol.scheme)) {
        const { scheme, amount, address } = protocol;

        dispatch(saveCoinProtocol(scheme, address, amount));
        dispatch(
            addToast({
                type: 'coin-scheme-protocol',
                address,
                scheme,
                amount,
                autoClose: false,
            }),
        );
    }
};

export const resetProtocol = (): ProtocolAction => ({
    type: PROTOCOL.RESET,
});
