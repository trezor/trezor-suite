import { type AccountKey } from '@suite-common/wallet-types';

import {
    type TronStakeRootState,
    type TronStakeState,
    type TronStakeTxReviewState,
    getInitialTronStakeSession,
} from './tronStakeReducer';
import { type TronFlow } from './tronStakeTypes';

export const selectTronStakeSession = (
    state: TronStakeRootState,
    accountKey: AccountKey,
    flow: TronFlow,
): TronStakeState =>
    state.wallet.tronStake.sessions[accountKey]?.[flow] ?? getInitialTronStakeSession(flow);

export const selectTronStakeTxReview = (state: TronStakeRootState): TronStakeTxReviewState =>
    state.wallet.tronStake.txReview;
