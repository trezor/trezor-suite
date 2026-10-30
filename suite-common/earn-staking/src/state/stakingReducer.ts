import { type Reducer, combineReducers } from '@reduxjs/toolkit';

import {
    type StakingPlatformState,
    stakingPlatformInitialState,
    stakingPlatformReducer,
} from './stakingPlatformReducer';
import {
    type StakingPositionsState,
    stakingPositionsActions,
    stakingPositionsInitialState,
    stakingPositionsReducer,
} from './stakingPositionsReducer';
import {
    type StakingProductsState,
    stakingProductsActions,
    stakingProductsInitialState,
    stakingProductsReducer,
} from './stakingProductsReducer';

export type StakingState = {
    platform: StakingPlatformState;
    products: StakingProductsState;
    positions: StakingPositionsState;
};

export type StakingRootState = {
    staking: StakingState;
};

export const stakingInitialState: StakingState = {
    platform: stakingPlatformInitialState,
    products: stakingProductsInitialState,
    positions: stakingPositionsInitialState,
};

export const stakingActions = {
    ...stakingProductsActions,
    ...stakingPositionsActions,
};

export const stakingReducer: Reducer<StakingState> = combineReducers({
    platform: stakingPlatformReducer,
    products: stakingProductsReducer,
    positions: stakingPositionsReducer,
});
