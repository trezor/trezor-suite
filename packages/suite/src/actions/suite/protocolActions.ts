import { PROTOCOL } from './constants';
import type { PROTOCOL_SCHEME } from '@suite-constants/protocol';
import type { SendFormState, AoppState } from '@suite-reducers/protocolReducer';

export type ProtocolAction =
    | {
          type: typeof PROTOCOL.FILL_SEND_FORM;
          payload: boolean;
      }
    | {
          type: typeof PROTOCOL.FILL_AOPP;
          payload: boolean;
      }
    | {
          type: typeof PROTOCOL.SAVE_COIN_PROTOCOL;
          payload: SendFormState;
      }
    | {
          type: typeof PROTOCOL.SAVE_AOPP_PROTOCOL;
          payload: AoppState;
      }
    | { type: typeof PROTOCOL.RESET };

export const fillSendForm = (shouldFill: boolean): ProtocolAction => ({
    type: PROTOCOL.FILL_SEND_FORM,
    payload: shouldFill,
});

export const saveCoinProtocol = (
    scheme: PROTOCOL_SCHEME,
    address: string,
    amount?: number,
): ProtocolAction => ({
    type: PROTOCOL.SAVE_COIN_PROTOCOL,
    payload: { scheme, address, amount },
});

export const fillAopp = (shouldFill: boolean): ProtocolAction => ({
    type: PROTOCOL.FILL_AOPP,
    payload: shouldFill,
});

export const saveAoppProtocol = (payload: AoppState): ProtocolAction => ({
    type: PROTOCOL.SAVE_AOPP_PROTOCOL,
    payload,
});

export const resetProtocol = (): ProtocolAction => ({
    type: PROTOCOL.RESET,
});
