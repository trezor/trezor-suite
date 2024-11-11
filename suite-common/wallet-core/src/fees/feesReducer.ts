import { createReducer } from '@reduxjs/toolkit';

import { NetworkSymbol, getNetworkType, networksCollection } from '@suite-common/wallet-config';
import { FeeInfo, FeeLevelLabel } from '@suite-common/wallet-types';
import { formatDuration } from '@suite-common/suite-utils';
import { getFeeLevels } from '@suite-common/wallet-utils';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
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

// Create app selector with WeakMap memoization since we'll be using parameters
const createMemoizedSelector = createWeakMapSelector.withTypes<FeesRootState>();

// Base selector for fees state
const selectFees = (state: FeesRootState) => state.wallet.fees;

export const selectNetworkFeeInfo = createMemoizedSelector(
    [selectFees, (_state: FeesRootState, networkSymbol?: NetworkSymbol) => networkSymbol],
    (fees, networkSymbol): FeeInfo | null => {
        if (!networkSymbol) return null;

        const networkType = getNetworkType(networkSymbol);
        const networkFeeInfo = fees[networkSymbol];
        const levels = returnStableArrayIfEmpty(getFeeLevels(networkType, networkFeeInfo));

        return { ...networkFeeInfo, levels };
    },
);

export const selectNetworkFeeLevel = createMemoizedSelector(
    [
        selectNetworkFeeInfo,
        (_state: FeesRootState, _networkSymbol?: NetworkSymbol, level?: FeeLevelLabel) => level,
    ],
    (networkFeeInfo, level): FeeLevel | null => {
        if (!networkFeeInfo) return null;
        const feeLevel = networkFeeInfo.levels.find(x => x.label === level);

        return feeLevel ?? null;
    },
);

export const selectNetworkFeeLevelTimeEstimate = createMemoizedSelector(
    [selectNetworkFeeInfo, selectNetworkFeeLevel],
    (networkFeeInfo, feeLevel): string | null => {
        if (!feeLevel || !networkFeeInfo) return null;

        return formatDuration(networkFeeInfo.blockTime * feeLevel.blocks * 60);
    },
);

export const selectNetworkFeeLevelFeePerUnit = createMemoizedSelector(
    [selectNetworkFeeLevel],
    (feeLevel): string | null => {
        if (!feeLevel) return null;

        return feeLevel.feePerUnit;
    },
);
