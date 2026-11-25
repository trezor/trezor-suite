import { type StakeSliceRootState } from '../stakingReducerTypes';

export const selectStake = (state: StakeSliceRootState) => state.wallet.stake;

export const selectStakeAccountKey = (state: StakeSliceRootState) => selectStake(state).accountKey;
