import { type TronStakeRootState, type TronStakeState } from './tronStakeReducer';

export const selectTronStakeSession = (state: TronStakeRootState): TronStakeState =>
    state.wallet.tronStake;
