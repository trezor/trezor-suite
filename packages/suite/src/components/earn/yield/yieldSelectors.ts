import type { YieldFlowType } from 'src/components/earn/yield/types';
import { getYieldSessionKey, initialYieldSessionState } from 'src/reducers/wallet/yieldReducer';
import type { YieldTxReviewState } from 'src/reducers/wallet/yieldReducer';
import { type AppState } from 'src/types/suite';

export const selectYield = (state: AppState) => state.wallet.yield;

export const selectYieldSession = (state: AppState, flowType: YieldFlowType, flowKey: string) =>
    selectYield(state)[flowType][getYieldSessionKey(flowKey)] ?? initialYieldSessionState;

export const selectYieldTxReview = (state: AppState): YieldTxReviewState =>
    state.wallet.yield.txReview;
