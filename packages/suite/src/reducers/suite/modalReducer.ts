import { MODAL, CONNECT } from '@suite-actions/constants';
import { TrezorDevice, Action } from '@suite-types';

export type State =
    | { context: typeof MODAL.CONTEXT_NONE }
    | {
          context: typeof MODAL.CONTEXT_DEVICE;
          device: TrezorDevice;
          instances?: TrezorDevice[];
          windowType?: string;
      };

const initialState: State = {
    context: MODAL.CONTEXT_NONE,
};

export default (state: State = initialState, action: Action): State => {
    switch (action.type) {
        // @ts-ignore TODO fix after connect types
        // case CONNECT.FORGET_REQUEST:
        // case CONNECT.TRY_TO_DUPLICATE:
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
};
