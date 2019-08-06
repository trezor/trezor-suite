/* eslint-disable */
import { TrezorDevice, Action } from '@suite-types';
import * as MODAL from '@suite-actions/constants/modalConstants';
import * as CONNECT from '@suite-actions/constants/trezorConnectConstants';

export type State =
    | { context: typeof MODAL.CONTEXT_NONE }
    | {
          context: typeof MODAL.CONTEXT_DEVICE;
          device: TrezorDevice;
          instances?: TrezorDevice[];
          windowType?: string;
      };

const initialState = {
    context: MODAL.CONTEXT_NONE,
};

export default function modal(state = initialState, action: Action) {
    switch (action.type) {
        // @ts-ignore TODO fix after connect types
        case CONNECT.FORGET_REQUEST:
        // @ts-ignore
        case CONNECT.TRY_TO_DUPLICATE:
        // @ts-ignore
        case CONNECT.REQUEST_WALLET_TYPE:
            return {
                context: MODAL.CONTEXT_DEVICE,
                // @ts-ignore
                device: action.device,
                // @ts-ignore
                windowType: action.type,
            };
        default:
            return state;
    }
}
