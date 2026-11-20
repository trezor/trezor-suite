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
import {
    type StakingSessionsState,
    stakingSessionsActions,
    stakingSessionsInitialState,
    stakingSessionsReducer,
} from './stakingSessionsReducer';

export type StakingState = {
    platform: StakingPlatformState;
    products: StakingProductsState;
    positions: StakingPositionsState;
    sessions: StakingSessionsState;
};

export type StakingRootState = {
    earn: { staking: StakingState };
};

export const stakingInitialState: StakingState = {
    platform: stakingPlatformInitialState,
    products: stakingProductsInitialState,
    positions: stakingPositionsInitialState,
    sessions: stakingSessionsInitialState,
};

export const stakingActions = {
    ...stakingProductsActions,
    ...stakingPositionsActions,
    ...stakingSessionsActions,
};

export const stakingReducer: Reducer<StakingState> = combineReducers({
    platform: stakingPlatformReducer,
    products: stakingProductsReducer,
    positions: stakingPositionsReducer,
    sessions: stakingSessionsReducer,
});
