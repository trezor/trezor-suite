import produce from 'immer';
import { FeeInfo } from 'src/types/wallet/sendForm';
import { Network, WalletAction } from 'src/types/wallet';

import { networksCompatibility } from '@suite-common/wallet-config';
import { blockchainActions } from '@suite-common/wallet-core';

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
export const initialState = networksCompatibility.reduce((state, network) => {
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
        if (blockchainActions.updateFee.match(action)) {
            return {
                ...draft,
                ...action.payload,
            };
        }
    });

export default feesReducer;
