import {
    type StablecoinYieldRootState,
    type StablecoinYieldSessionState,
    type StablecoinYieldTxReviewState,
    getStablecoinYieldSessionKey,
    initialStablecoinYieldSessionState,
} from './stablecoinYieldReducer';
import type { YieldFlowType } from './stablecoinYieldTypes';

export const selectStablecoinYield = (state: StablecoinYieldRootState) =>
    state.wallet.stablecoinYield;

export const selectStablecoinYieldSessionByFlowKey = (
    state: StablecoinYieldRootState,
    flowType: YieldFlowType,
    flowKey: string | null,
): StablecoinYieldSessionState | null => {
    if (!flowKey) {
        return null;
    }

    return selectStablecoinYield(state)[flowType][getStablecoinYieldSessionKey(flowKey)] ?? null;
};

export const selectStablecoinYieldSession = (
    state: StablecoinYieldRootState,
    flowType: YieldFlowType,
    flowKey: string,
) =>
    selectStablecoinYieldSessionByFlowKey(state, flowType, flowKey) ??
    initialStablecoinYieldSessionState;

export const selectStablecoinYieldTxReview = (
    state: StablecoinYieldRootState,
): StablecoinYieldTxReviewState => state.wallet.stablecoinYield.txReview;
