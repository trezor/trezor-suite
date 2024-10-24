import { createReducer } from '@reduxjs/toolkit';
import { memoizeWithArgs } from 'proxy-memoize';
import { D } from '@mobily/ts-belt';

import {
    NetworkSymbol,
    getNetworkType,
    networks,
    networksCollection,
} from '@suite-common/wallet-config';
import { FeeInfo, FeeLevelLabel } from '@suite-common/wallet-types';
import { formatDuration } from '@suite-common/suite-utils';
import { FeeLevel } from '@trezor/connect';
import { getFeeLevels } from '@suite-common/wallet-utils';

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
const initialState = networksCollection.reduce((state, network) => {
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

export const selectNetworkFeeInfo = memoizeWithArgs(
    (state: FeesRootState, networkSymbol?: NetworkSymbol): FeeInfo | null => {
        if (!networkSymbol) return null;

        const networkType = getNetworkType(networkSymbol);

        const networkFeeInfo = state.wallet.fees[networkSymbol];
        const levels = getFeeLevels(networkType, networkFeeInfo);

        return { ...networkFeeInfo, levels };
    },
    { size: D.keys(networks).length },
);

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
