// import * as CONNECT from '@wallet-actions/constants/TrezorConnect';
// import * as WALLET from '@wallet-actions/constants/wallet';
import * as TOKEN from '@wallet-actions/constants/token';
import produce from 'immer';

import { Token } from '@suite/types/wallet';
import { Actions } from '@wallet-types/index';

export type State = Token[];

const initialState: State = [
    // {
    //     loaded: true,
    //     deviceState: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
    //     network: 'eth',
    //     name: '$TEAK',
    //     symbol: '$TEAK',
    //     address: '0x7DD7F56D697Cc0f2b52bD55C057f378F1fE6Ab4b',
    //     ethAddress: 'rNaqKtKrMSwpwZSzRckPf7S96DkimjkF4H',
    //     decimals: 18,
    //     balance: '0',
    // },
];

const create = (state: State, token: Token): State => {
    state.push(token);
    return state;
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

export default (state: State = initialState, action: Actions): State => {
    return produce(state, draft => {
        switch (action.type) {
            case TOKEN.FROM_STORAGE:
                return action.payload;
            case TOKEN.ADD:
                create(draft, action.payload);
                break;
            case TOKEN.REMOVE:
                remove(draft, action.token);
                break;
            case TOKEN.SET_BALANCE:
                return action.payload;

            // case CONNECT.FORGET:
            // case CONNECT.FORGET_SINGLE:
            // case CONNECT.FORGET_SILENT:
            // case CONNECT.RECEIVE_WALLET_TYPE:
            //     return forget(state, action.device);

            // case WALLET.CLEAR_UNAVAILABLE_DEVICE_DATA:
            //     return clear(state, action.devices);

            // no default
        }
    });
};
