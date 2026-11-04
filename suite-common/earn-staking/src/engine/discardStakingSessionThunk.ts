import { createThunk } from '@trezor/redux-utils';

import { STAKING_ENGINE_ACTION_PREFIX } from './constants';
import type { StakingEngineRejection } from './stakingEngineRejection';
import { type StakingRootState, stakingActions } from '../state/stakingReducer';
import type { StakingSessionKey } from '../state/stakingSessionKey';
import { selectStakingSession } from '../state/stakingSessionSelectors';
import { STAKING_IN_FLIGHT_STEP_STATUSES } from '../state/stakingSessionStep';
import { hasStakingStepWithStatus } from '../state/stakingSessionsReducer';

type DiscardStakingSessionParams = {
    sessionKey: StakingSessionKey;
};

export type DiscardStakingSessionThunkState = StakingRootState;

export const discardStakingSessionThunk = createThunk<
    void,
    DiscardStakingSessionParams,
    { state: DiscardStakingSessionThunkState; rejectValue: StakingEngineRejection }
>(
    `${STAKING_ENGINE_ACTION_PREFIX}/discardStakingSession`,
    ({ sessionKey }, { dispatch, getState, rejectWithValue }) => {
        const session = selectStakingSession(getState(), sessionKey);

        if (session === null) {
            return rejectWithValue('session-not-found');
        }

        if (hasStakingStepWithStatus(session, STAKING_IN_FLIGHT_STEP_STATUSES)) {
            return rejectWithValue('step-in-flight');
        }

        dispatch(stakingActions.sessionDiscarded({ sessionKey }));
    },
);
