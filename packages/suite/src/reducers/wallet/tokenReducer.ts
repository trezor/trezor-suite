// import * as CONNECT from '@wallet-actions/constants/TrezorConnect';
// import * as WALLET from '@wallet-actions/constants/wallet';
import * as TOKEN from '@wallet-actions/constants/token';

import { Token } from '@suite/types/wallet';
import { Action } from '@suite-types/index';

export type State = Token[];

const initialState: State = [];

const create = (state: State, token: Token): State => {
    const newState: State = [...state];
    newState.push(token);
    return newState;
};

// const forget = (state: State, device: TrezorDevice): State =>
//     state.filter(t => t.deviceState !== device.state);

// const clear = (state: State, devices: TrezorDevice[]): State => {
//     let newState: State = [...state];
//     devices.forEach(d => {
//         newState = forget(newState, d);
//     });
//     return newState;
// };

const remove = (state: State, token: Token): State =>
    state.filter(
        t =>
            !(
                t.ethAddress === token.ethAddress &&
                t.address === token.address &&
                t.deviceState === token.deviceState
            ),
    );

export default (state: State = initialState, action: Action): State => {
    switch (action.type) {
        case TOKEN.FROM_STORAGE:
            return action.payload;

        case TOKEN.ADD:
            return create(state, action.payload);
        case TOKEN.REMOVE:
            return remove(state, action.token);
        case TOKEN.SET_BALANCE:
            return action.payload;

        // case CONNECT.FORGET:
        // case CONNECT.FORGET_SINGLE:
        // case CONNECT.FORGET_SILENT:
        // case CONNECT.RECEIVE_WALLET_TYPE:
        //     return forget(state, action.device);

        // case WALLET.CLEAR_UNAVAILABLE_DEVICE_DATA:
        //     return clear(state, action.devices);

        default:
            return state;
    }
};
