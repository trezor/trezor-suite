import { createReducer } from '@reduxjs/toolkit';

import { FeeInfo } from '@suite-common/wallet-types';
import { Network, networksCompatibility } from '@suite-common/wallet-config';

import { blockchainActions } from '../blockchain/blockchainActions';

export type FeesState = {
    [key in Network['symbol']]: FeeInfo;
};

export type FeesRootState = {
    wallet: {
        fees: FeesState;
    };
};

// fill initial state, those values will be changed by BLOCKCHAIN.UPDATE_FEE action
const initialState = networksCompatibility.reduce((state, network) => {
    if (network.accountType) return state;
    state[network.symbol] = {
        blockHeight: 0,
        blockTime: 10,
        minFee: 1,
        maxFee: 100,
        levels: [{ label: 'normal', feePerUnit: '1', blocks: 0 }],
    };

    return state;
}, {} as FeesState);

export const feesReducer = createReducer(initialState, builder => {
    builder.addCase(blockchainActions.updateFee, (state, { payload }) => {
        return {
            ...state,
            ...payload,
        };
    });
});
