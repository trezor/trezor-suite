import { createReducer } from '@reduxjs/toolkit';

import { createWeakMapSelector } from '@suite-common/redux-utils';
import { formatDurationStrict } from '@suite-common/suite-utils';
import { type NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import {
    type FeeInfo,
    type FeeLevelLabel,
    type FeesState,
    type FeesStatus,
} from '@suite-common/wallet-types';
import { getConvertedOrDefaultFeeInfo, isEip1559 } from '@suite-common/wallet-utils';
import { type FeeLevel } from '@trezor/connect';

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

export const feesInitialState: FeesState = {};

export const feesReducer = createReducer<FeesState>(feesInitialState, builder => {
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
        const feeInfo = getConvertedOrDefaultFeeInfo({
            networkType,
            feeInfo: fees[symbol].data,
        });

        return feeInfo;
    },
);

/**
 * Returns whether the network supports EIP-1559 based on the fee info.
 */
export const selectIsEip1559Fee = createMemoizedSelector(
    [(_state: FeesRootState, symbol?: NetworkSymbol) => symbol, selectConvertedNetworkFeeInfo],
    (symbol, feeInfo): boolean => {
        if (!symbol || !feeInfo?.levels?.[0]) return false;

        return isEip1559(feeInfo.levels[0]);
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
    [
        selectConvertedNetworkFeeInfo,
        selectNetworkFeeLevel,
        (_state: FeesRootState, symbol?: NetworkSymbol) => symbol,
    ],
    (networkFeeInfo, feeLevel, symbol): string | null => {
        if (!feeLevel || !networkFeeInfo) return null;

        const networkType = symbol ? getNetworkType(symbol) : null;

        const multiplier = networkType === 'bitcoin' ? 60 : 1;

        return formatDurationStrict(networkFeeInfo.blockTime * feeLevel.blocks * multiplier);
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
