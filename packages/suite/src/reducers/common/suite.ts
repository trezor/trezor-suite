import { TRANSPORT } from 'trezor-connect';
import { SUITE } from '@suite/actions/constants';
import { Action, TrezorDevice } from '@suite/types';

interface SuiteState {
    loading: boolean;
    loaded: boolean;
    error?: string;
    transport?: Transport;
    device?: TrezorDevice,
}

interface Transport {
    type?: string,
    bridge: {
        version: [],
        directory: '',
        packages: [],
        changelog: [],
    },
}

const initialState: SuiteState = {
    loading: true,
    loaded: false,
};

export default (state: SuiteState = initialState, action: Action): SuiteState => {
    switch (action.type) {
        case SUITE.INIT:
            return initialState;
        case SUITE.READY:
            return {
                loading: false,
                loaded: true,
            };
        case SUITE.ERROR:
            return {
                loading: false,
                loaded: false,
                error: action.error,
            };
        case SUITE.SELECT_DEVICE:
            return {
                ...state,
                device: action.payload,
            }

        case TRANSPORT.START:
            return {
                ...state,
                transport: action.payload,
            }
        case TRANSPORT.ERROR:
            return {
                ...state,
                transport: {
                    bridge: action.payload.bridge,
                }
            }
        default:
            return state;
    }
};
