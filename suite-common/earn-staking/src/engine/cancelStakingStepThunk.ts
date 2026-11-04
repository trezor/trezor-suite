import { type AnalyticsDep, events } from '@suite-common/analytics';
import type { AccountsRootState } from '@suite-common/wallet-core';
import { type WithServices, createThunk } from '@trezor/redux-utils';

import type { StakingDep } from '../stakingServices';
import { STAKING_ENGINE_ACTION_PREFIX } from './constants';
import type { StakingEngineRejection } from './stakingEngineRejection';
import { type StakingRootState, stakingActions } from '../state/stakingReducer';
import type { StakingSessionKey } from '../state/stakingSessionKey';
import { selectStakingStepContext } from '../state/stakingSessionSelectors';

type CancelStakingStepParams = {
    sessionKey: StakingSessionKey;
};

export type CancelStakingStepThunkState = StakingRootState & AccountsRootState;

export type CancelStakingStepThunkDeps = WithServices<StakingDep & AnalyticsDep>;

export const cancelStakingStepThunk = createThunk<
    void,
    CancelStakingStepParams,
    {
        state: CancelStakingStepThunkState;
        extra: CancelStakingStepThunkDeps;
        rejectValue: StakingEngineRejection;
    }
>(
    `${STAKING_ENGINE_ACTION_PREFIX}/cancelStakingStep`,
    ({ sessionKey }, { dispatch, getState, extra, rejectWithValue }) => {
        const stepContext = selectStakingStepContext(getState(), sessionKey);

        if (!stepContext.success) {
            return rejectWithValue(stepContext.rejection);
        }

        const { step, account } = stepContext.context;

        if (step.status === 'signing') {
            extra.services.staking.deviceAccess.cancel('tx-cancelled');

            dispatch(stakingActions.stepReset({ sessionKey, stepId: step.id, error: null }));

            return;
        }

        if (step.status === 'signed') {
            dispatch(stakingActions.stepReset({ sessionKey, stepId: step.id, error: null }));

            extra.services.analytics.report({
                type: events.transactionCancelEvent.name,
                payload: { txType: 'stake', networkSymbol: account.symbol, stage: 'review' },
            });

            return;
        }

        return rejectWithValue('step-not-ready');
    },
);
