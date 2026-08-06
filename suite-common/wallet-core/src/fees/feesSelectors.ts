import { createWeakMapSelector } from '@suite-common/redux-utils';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type FeeInfo, type FeesState } from '@suite-common/wallet-types';

export type FeesRootState = { wallet: { fees: FeesState } };

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
