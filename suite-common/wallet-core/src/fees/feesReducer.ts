import { createReducer } from '@reduxjs/toolkit';

import { createWeakMapSelector } from '@suite-common/redux-utils';
import { formatDuration } from '@suite-common/suite-utils';
import { NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import { FeeInfo, FeeLevelLabel, FeesState, FeesStatus } from '@suite-common/wallet-types';
import { getFeeInfo } from '@suite-common/wallet-utils';
import { FeeLevel } from '@trezor/connect';

import { feesActions } from './feesActions';
import { updateFeeInfoThunk } from './feesThunks';

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
    builder.addCase(feesActions.updateFee, (state, { payload: { symbol, data } }) => {
        const defaultStatus = 'loaded'; // in case the object doesn't exist yet (shouldn't happen)
        state[symbol] = { status: defaultStatus, ...state[symbol], data };
    });
    builder.addCase(feesActions.updateMultipleFees, (state, { payload }) => ({
        ...state,
        ...payload,
    }));
    builder.addCase(updateFeeInfoThunk.pending, (state, action) => {
        const { networkSymbol } = action.meta.arg;
        // at this point, the object may not exist yet (if this is the first call of the thunk)
        state[networkSymbol] = { ...state[networkSymbol], status: 'loading' };
    });
    builder.addCase(updateFeeInfoThunk.fulfilled, (state, action) => {
        const { networkSymbol } = action.meta.arg;
        const data = action.payload;
        state[networkSymbol] = { ...state[networkSymbol], status: 'loaded', data };
    });
    builder.addCase(updateFeeInfoThunk.rejected, (state, action) => {
        const { networkSymbol } = action.meta.arg;
        state[networkSymbol] = { ...state[networkSymbol], status: 'error' };
    });
});

// Create app selector with WeakMap memoization since we'll be using parameters
const createMemoizedSelector = createWeakMapSelector.withTypes<FeesRootState>();

// Base selector for fees state
export const selectFees = (state: FeesRootState) => state.wallet.fees;

/**
 * Returns raw feeInfo per network
 */
export const selectRawNetworkFeeInfo = createMemoizedSelector(
    [selectFees, (_state: FeesRootState, symbol?: NetworkSymbol) => symbol],
    (fees, symbol): FeeInfo | undefined => (symbol !== undefined ? fees[symbol]?.data : undefined),
);

/**
 * Returns feeInfo per network, cleaned up, and for Ethereum also converted from wei to Gwei.
 */
export const selectConvertedNetworkFeeInfo = createMemoizedSelector(
    [selectFees, (_state: FeesRootState, symbol?: NetworkSymbol) => symbol],
    (fees, symbol): FeeInfo | null => {
        if (!symbol || !fees[symbol]) return null;

        const networkType = getNetworkType(symbol);
        const feeInfo = getFeeInfo({
            networkType,
            feeInfo: fees[symbol].data,
        });

        return feeInfo;
    },
);

export const selectNetworkFeeLevel = createMemoizedSelector(
    [
        selectConvertedNetworkFeeInfo,
        (_state: FeesRootState, _symbol?: NetworkSymbol, level?: FeeLevelLabel) => level,
    ],
    (networkFeeInfo, level): FeeLevel | null => {
        if (!networkFeeInfo) return null;
        const feeLevel = networkFeeInfo.levels.find(x => x.label === level);

        return feeLevel ?? null;
    },
);

export const selectConvertedNetworkFeeLevelTimeEstimate = createMemoizedSelector(
    [selectConvertedNetworkFeeInfo, selectNetworkFeeLevel],
    (networkFeeInfo, feeLevel): string | null => {
        if (!feeLevel || !networkFeeInfo) return null;

        return formatDuration(networkFeeInfo.blockTime * feeLevel.blocks * 60);
    },
);

export const selectConvertedNetworkFeeLevelFeePerUnit = createMemoizedSelector(
    [selectNetworkFeeLevel],
    (feeLevel): string | null => {
        if (!feeLevel) return null;

        return feeLevel.feePerUnit;
    },
);

export const selectNetworkFeeStatus = createMemoizedSelector(
    [selectFees, (_state: FeesRootState, symbol?: NetworkSymbol) => symbol],
    (fees, symbol): FeesStatus | null => {
        if (symbol === undefined || !fees[symbol]) return null;

        return fees[symbol].status;
    },
);

export const selectAreFeesLoading = createMemoizedSelector(
    [selectNetworkFeeStatus],
    feeStatus => feeStatus === 'loading',
);
