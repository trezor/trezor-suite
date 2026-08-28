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
import { type FeesRootState, selectFees, selectRawNetworkFeeInfo } from './feesSelectors';
import { updateFeeInfoThunk } from './feesThunks';

export { type FeesRootState, selectFees, selectRawNetworkFeeInfo } from './feesSelectors';

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

/**
 * Returns feeInfo per network, cleaned up, and for Ethereum also converted from wei to Gwei.
 *
 * Inputs are limited to the given network's fee data (plus entry existence) so the returned
 * reference stays stable across unrelated fees updates — other networks' fees and status-only
 * changes (e.g. `loading`) of the same network.
 */
export const selectConvertedNetworkFeeInfo = createMemoizedSelector(
    [
        selectRawNetworkFeeInfo,
        (state: FeesRootState, symbol?: NetworkSymbol) =>
            symbol !== undefined && selectFees(state)[symbol] !== undefined,
        (_state: FeesRootState, symbol?: NetworkSymbol) => symbol,
    ],
    (rawFeeInfo, hasFeeEntry, symbol): FeeInfo | null => {
        if (!symbol || !hasFeeEntry) return null;

        const networkType = getNetworkType(symbol);

        return getConvertedOrDefaultFeeInfo({
            networkType,
            feeInfo: rawFeeInfo,
        });
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
