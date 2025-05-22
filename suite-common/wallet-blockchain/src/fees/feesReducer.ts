import { createReducer } from '@reduxjs/toolkit';

import { createWeakMapSelector } from '@suite-common/redux-utils';
import { formatDuration } from '@suite-common/suite-utils';
import { NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import { FeeInfo, FeeLevelLabel } from '@suite-common/wallet-types';
import { getFeeInfo } from '@suite-common/wallet-utils';
import { FeeLevel } from '@trezor/connect';

import { feesActions } from './feesActions';

export type FeesState = {
    [key in NetworkSymbol]?: FeeInfo;
};

export type FeesRootState = {
    wallet: {
        fees: FeesState;
    };
};

export const DEFAULT_FEE_INFO: FeeInfo = {
    blockHeight: 0,
    blockTime: 10,
    minFee: 1,
    maxFee: 100,
    minPriorityFee: 0,
    levels: [{ label: 'normal', feePerUnit: '1', blocks: 0 }],
};

export const feesReducer = createReducer<FeesState>({}, builder => {
    builder.addCase(feesActions.updateFee, (state, { payload }) => ({
        ...state,
        ...payload,
    }));
    builder.addCase(feesActions.removeFee, (state, { payload }) => {
        const newState = { ...state };

        delete newState[payload.network];

        return newState;
    });
});

// Create app selector with WeakMap memoization since we'll be using parameters
const createMemoizedSelector = createWeakMapSelector.withTypes<FeesRootState>();

// Base selector for fees state
export const selectFees = (state: FeesRootState) => state.wallet.fees;

export const selectNetworkFeeInfo = createMemoizedSelector(
    [selectFees, (_state: FeesRootState, symbol?: NetworkSymbol) => symbol],
    (fees, symbol): FeeInfo | null => {
        if (!symbol || !fees[symbol]) return null;

        const networkType = getNetworkType(symbol);
        const feeInfo = getFeeInfo({
            networkType,
            feeInfo: fees[symbol],
        });

        return feeInfo;
    },
);

export const selectNetworkFeeLevel = createMemoizedSelector(
    [
        selectNetworkFeeInfo,
        (_state: FeesRootState, _symbol?: NetworkSymbol, level?: FeeLevelLabel) => level,
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
