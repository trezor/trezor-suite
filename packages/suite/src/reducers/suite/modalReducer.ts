import { TrezorDevice, Action } from '@suite-types/index';
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
        case CONNECT.FORGET_REQUEST:
        case CONNECT.TRY_TO_DUPLICATE:
        case CONNECT.REQUEST_WALLET_TYPE:
            return {
                context: MODAL.CONTEXT_DEVICE,
                device: action.device,
                windowType: action.type | '@connect/wallet-type',
            };

        default:
            return state;
    }
}
