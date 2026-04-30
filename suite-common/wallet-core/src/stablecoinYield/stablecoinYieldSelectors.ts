import {
    type StablecoinYieldRootState,
    type StablecoinYieldTxReviewState,
    getStablecoinYieldSessionKey,
    initialStablecoinYieldSessionState,
} from './stablecoinYieldReducer';
import type { YieldSessionType } from './stablecoinYieldTypes';

export const selectStablecoinYield = (state: StablecoinYieldRootState) =>
    state.wallet.stablecoinYield;

export const selectStablecoinYieldSession = (
    state: StablecoinYieldRootState,
    flowType: YieldSessionType,
    flowKey: string,
) =>
    selectStablecoinYield(state)[flowType][getStablecoinYieldSessionKey(flowKey)] ??
    initialStablecoinYieldSessionState;

export const selectStablecoinYieldTxReview = (
    state: StablecoinYieldRootState,
): StablecoinYieldTxReviewState => state.wallet.stablecoinYield.txReview;
