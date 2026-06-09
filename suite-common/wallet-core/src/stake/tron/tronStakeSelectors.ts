import { type AccountKey } from '@suite-common/wallet-types';

import {
    type TronStakeRootState,
    type TronStakeState,
    type TronStakeTxReviewState,
    initialTronStakeSession,
} from './tronStakeReducer';

export const selectTronStakeSession = (
    state: TronStakeRootState,
    accountKey: AccountKey,
): TronStakeState => state.wallet.tronStake.sessions[accountKey] ?? initialTronStakeSession;

export const selectTronStakeTxReview = (state: TronStakeRootState): TronStakeTxReviewState =>
    state.wallet.tronStake.txReview;
