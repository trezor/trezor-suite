import { type Reducer, combineReducers } from 'redux';

import { type StakingState, stakingReducer } from '@suite-common/earn-staking';

export type EarnState = {
    staking: StakingState;
};

export const earnReducers: Reducer<EarnState> = combineReducers({
    staking: stakingReducer,
});
