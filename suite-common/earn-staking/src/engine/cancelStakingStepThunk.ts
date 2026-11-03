import { type AnalyticsDep, events } from '@suite-common/analytics';
import type { AccountsRootState } from '@suite-common/wallet-core';
import { type WithServices, createThunk } from '@trezor/redux-utils';

import type { StakingDep } from '../stakingServices';
import { STAKING_ENGINE_ACTION_PREFIX } from './constants';
import type { StakingEngineRejection } from './stakingEngineRejection';
import { getStakingStepContext } from './stakingStepContext';
import { type StakingRootState, stakingActions } from '../state/stakingReducer';
import type { StakingSessionKey } from '../state/stakingSessionKey';

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
        const { stakingProductRepository } = extra.services.staking;

        const resolved = getStakingStepContext({
            state: getState(),
            sessionKey,
            stakingProductRepository,
        });

        if (!resolved.success) {
            return rejectWithValue(resolved.rejection);
        }

        const { step, account } = resolved.context;

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
