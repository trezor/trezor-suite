import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { createWeakMapSelector } from '@suite-common/redux-utils';
import { type NetworkSymbol } from '@suite-common/wallet-config';

import { type FeesRootState, selectConvertedNetworkFeeInfo } from '../fees/feesReducer';
import { isWrappedNativeFlowSupported } from './utils/yieldDeviceUtils';
import { getYieldGasReserve } from './utils/yieldGasReserve';
import {
    type YieldRootState,
    type YieldSessionState,
    type YieldTxReviewState,
    getYieldSessionKey,
    initialStablecoinYieldSessionState,
} from './yieldReducer';
import type { YieldFlowType, YieldGasReserve } from './yieldTypes';

const createFeesMemoizedSelector = createWeakMapSelector.withTypes<FeesRootState>();

export const selectIsWrappedNativeFlowSupported = (state: DeviceRootState): boolean =>
    isWrappedNativeFlowSupported(selectSelectedDevice(state));

export const selectYield = (state: YieldRootState) => state.wallet.stablecoinYield;

export const selectYieldSessionByFlowKey = (
    state: YieldRootState,
    flowType: YieldFlowType,
    flowKey: string | null,
): YieldSessionState | null => {
    if (!flowKey) {
        return null;
    }

    return selectYield(state)[flowType][getYieldSessionKey(flowKey)] ?? null;
};

export const selectYieldSession = (
    state: YieldRootState,
    flowType: YieldFlowType,
    flowKey: string,
) => selectYieldSessionByFlowKey(state, flowType, flowKey) ?? initialStablecoinYieldSessionState;

export const selectYieldTxReview = (state: YieldRootState): YieldTxReviewState =>
    state.wallet.stablecoinYield.txReview;

export const selectYieldGasReserve = createFeesMemoizedSelector(
    [
        selectConvertedNetworkFeeInfo,
        (
            _state: FeesRootState,
            _symbol: NetworkSymbol | undefined,
            isWrappedNativeVault: boolean,
        ) => isWrappedNativeVault,
        (
            _state: FeesRootState,
            _symbol: NetworkSymbol | undefined,
            _isWrappedNativeVault: boolean,
            tokenContractAddress?: string | null,
        ) => tokenContractAddress,
    ],
    (feeInfo, isWrappedNativeVault, tokenContractAddress): YieldGasReserve | null =>
        getYieldGasReserve({
            feeLevel: feeInfo?.levels.find(level => level.label === 'normal'),
            isWrappedNativeVault,
            tokenContractAddress,
        }),
);
