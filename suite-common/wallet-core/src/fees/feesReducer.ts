import { createReducer } from '@reduxjs/toolkit';

import type { GetNetworkConfigDep } from '@suite-common/networks';
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

export type FeesRootState = { wallet: { fees: FeesState } };

export const feesInitialState: FeesState = {};

export const feesReducer = createReducer<FeesState>(feesInitialState, builder => {
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

const getConvertedNetworkFeeInfo = (
    fees: FeesState,
    symbol: NetworkSymbol | undefined,
    deps: GetNetworkConfigDep,
): FeeInfo | null => {
    if (!symbol || !fees[symbol]) return null;

    return getConvertedOrDefaultFeeInfo({
        networkType: getNetworkType(deps, symbol),
        feeInfo: fees[symbol].data,
    });
};

/**
 * Returns feeInfo per network, cleaned up, and for Ethereum also converted from wei to Gwei.
 */
export const selectConvertedNetworkFeeInfo = createMemoizedSelector(
    [
        selectFees,
        (_state: FeesRootState, symbol?: NetworkSymbol) => symbol,
        (_state, _symbol: NetworkSymbol | undefined, deps: GetNetworkConfigDep) => deps,
    ],
    getConvertedNetworkFeeInfo,
);

/**
 * Returns whether the network supports EIP-1559 based on the fee info.
 */
export const selectIsEip1559Fee = createMemoizedSelector(
    [
        selectFees,
        (_state: FeesRootState, symbol?: NetworkSymbol) => symbol,
        (_state, _symbol: NetworkSymbol | undefined, deps: GetNetworkConfigDep) => deps,
    ],
    (fees, symbol, deps): boolean => {
        const feeInfo = getConvertedNetworkFeeInfo(fees, symbol, deps);
        if (!symbol || !feeInfo?.levels?.[0]) return false;

        return isEip1559(feeInfo.levels[0]);
    },
);

export const selectNetworkFeeLevel = createMemoizedSelector(
    [
        selectFees,
        (_state: FeesRootState, symbol?: NetworkSymbol) => symbol,
        (_state: FeesRootState, _symbol?: NetworkSymbol, level?: FeeLevelLabel) => level,
        (
            _state: FeesRootState,
            _symbol: NetworkSymbol | undefined,
            _level: FeeLevelLabel | undefined,
            deps: GetNetworkConfigDep,
        ) => deps,
    ],
    (fees, symbol, level, deps): FeeLevel | null => {
        const networkFeeInfo = getConvertedNetworkFeeInfo(fees, symbol, deps);
        if (!networkFeeInfo) return null;
        const feeLevel = networkFeeInfo.levels.find(x => x.label === level);

        return feeLevel ?? null;
    },
);

export const selectConvertedNetworkFeeLevelTimeEstimate = createMemoizedSelector(
    [
        selectFees,
        (_state: FeesRootState, symbol?: NetworkSymbol) => symbol,
        (_state: FeesRootState, _symbol?: NetworkSymbol, level?: FeeLevelLabel) => level,
        (
            _state: FeesRootState,
            _symbol: NetworkSymbol | undefined,
            _level: FeeLevelLabel | undefined,
            deps: GetNetworkConfigDep,
        ) => deps,
    ],
    (fees, symbol, level, deps): string | null => {
        const networkFeeInfo = getConvertedNetworkFeeInfo(fees, symbol, deps);
        const feeLevel = networkFeeInfo?.levels.find(item => item.label === level);
        if (!feeLevel || !networkFeeInfo) return null;

        const networkType = symbol ? getNetworkType(deps, symbol) : null;

        const multiplier = networkType === 'bitcoin' ? 60 : 1;

        return formatDurationStrict(networkFeeInfo.blockTime * feeLevel.blocks * multiplier);
    },
);

export const selectConvertedNetworkFeeLevelFeePerUnit = createMemoizedSelector(
    [
        selectFees,
        (_state: FeesRootState, symbol?: NetworkSymbol) => symbol,
        (_state: FeesRootState, _symbol?: NetworkSymbol, level?: FeeLevelLabel) => level,
        (
            _state: FeesRootState,
            _symbol: NetworkSymbol | undefined,
            _level: FeeLevelLabel | undefined,
            deps: GetNetworkConfigDep,
        ) => deps,
    ],
    (fees, symbol, level, deps): string | null => {
        const networkFeeInfo = getConvertedNetworkFeeInfo(fees, symbol, deps);
        const feeLevel = networkFeeInfo?.levels.find(item => item.label === level);
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
