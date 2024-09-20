import { createReducer } from '@reduxjs/toolkit';

import { NetworkSymbol, networksCompatibility } from '@suite-common/wallet-config';
import { FeeInfo, FeeLevelLabel } from '@suite-common/wallet-types';
import { formatDuration } from '@suite-common/suite-utils';
import { FeeLevel } from '@trezor/connect';

import { blockchainActions } from '../blockchain/blockchainActions';

export type FeesState = {
    [key in NetworkSymbol]: FeeInfo;
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

export const selectNetworkFeeInfo = (state: FeesRootState, networkSymbol?: NetworkSymbol) =>
    networkSymbol ? state.wallet.fees[networkSymbol] : null;

export const selectNetworkFeeLevel = (
    state: FeesRootState,
    level: FeeLevelLabel,
    networkSymbol?: NetworkSymbol,
): FeeLevel | null => {
    const networkFeeInfo = selectNetworkFeeInfo(state, networkSymbol);
    if (!networkFeeInfo) return null;

    const feeLevel = networkFeeInfo.levels.find(x => x.label === level);

    return feeLevel ?? null;
};

export const selectNetworkFeeLevelTimeEstimate = (
    state: FeesRootState,
    level: FeeLevelLabel,
    networkSymbol?: NetworkSymbol,
): string | null => {
    const networkFeeInfo = selectNetworkFeeInfo(state, networkSymbol);
    const feeLevel = selectNetworkFeeLevel(state, level, networkSymbol);
    if (!feeLevel || !networkFeeInfo) return null;

    return formatDuration(networkFeeInfo.blockTime * feeLevel.blocks * 60);
};

export const selectNetworkFeeLevelFeePerUnit = (
    state: FeesRootState,
    level: FeeLevelLabel,
    networkSymbol?: NetworkSymbol,
): string | null => {
    const feeLevel = selectNetworkFeeLevel(state, level, networkSymbol);
    if (!feeLevel) return null;

    return feeLevel.feePerUnit;
};
