import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';

import { isWrappedNativeFlowSupported } from './utils/yieldDeviceUtils';
import {
    type YieldRootState,
    type YieldSessionState,
    type YieldTxReviewState,
    getYieldSessionKey,
    initialStablecoinYieldSessionState,
} from './yieldReducer';
import type { YieldFlowType } from './yieldTypes';

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
