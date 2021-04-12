import produce from 'immer';
import { FeeInfo } from '@wallet-types/sendForm';
import { BLOCKCHAIN } from '@wallet-actions/constants';
import { NETWORKS } from '@wallet-config';
import { Network, WalletAction } from '@wallet-types';

// type Symbol = Network['symbol'] | 'erc20';
export type State = {
    [key in Network['symbol']]: FeeInfo;
};

const initialStatePredefined: Partial<State> = {
    // erc20: {
    //     blockHeight: 0,
    //     blockTime: 10,
    //     minFee: 1,
    //     maxFee: 100,
    //     levels: [{ label: 'normal', feePerUnit: '1', blocks: 0 }],
    // },
};

// fill initial state, those values will be changed by BLOCKCHAIN.UPDATE_FEE action
export const initialState = NETWORKS.reduce((state, network) => {
    if (network.accountType) return state;
    state[network.symbol] = {
        blockHeight: 0,
        blockTime: 10,
        minFee: 1,
        maxFee: 100,
        levels: [{ label: 'normal', feePerUnit: '1', blocks: 0 }],
    };
    return state;
}, initialStatePredefined as State);

const feesReducer = (state: State = initialState, action: WalletAction) =>
    produce(state, draft => {
        switch (action.type) {
            case BLOCKCHAIN.UPDATE_FEE:
                return {
                    ...draft,
                    ...action.payload,
                };
            // no default
        }
    });

export default feesReducer;
