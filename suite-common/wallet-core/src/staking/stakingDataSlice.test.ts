import { type StakingBatchDataItem } from '@suite-common/earn-staking-api';

import {
    type StakeDataState,
    stakeDataActions,
    stakeDataInitialState,
    stakeDataReducer,
} from './stakingDataSlice';

const LAST_SUCCESS_AT = new Date('2026-01-01T00:00:00Z').getTime();
const TWO_MINUTES_LATER = new Date('2026-01-01T00:02:00Z').getTime();

const solSection = {
    symbol: 'sol',
    stats: { apy: 7.5 },
} satisfies StakingBatchDataItem;

const stateAfterPreviousSuccess = (): StakeDataState => ({
    error: null,
    isLoading: false,
    lastSuccessAt: LAST_SUCCESS_AT,
    data: {
        eth: { stats: { apy: 3.08, nextRewardPayout: 3600 }, validators: {} },
        sol: { stats: { apy: 6.24 } },
        ada: { pools: [{ apy: 2.4, saturation: 80.77, id: 'pool1' }] },
    },
});

describe('stakeDataReducer', () => {
    afterEach(() => {
        jest.useRealTimers();
    });

    it('keeps the last success timestamp while a refetch is in flight', () => {
        const state = stakeDataReducer(
            stateAfterPreviousSuccess(),
            stakeDataActions.fetchStakeDataRequest(),
        );

        expect(state.lastSuccessAt).toBe(LAST_SUCCESS_AT);
        expect(state.data).toEqual(stateAfterPreviousSuccess().data);
        expect(state.isLoading).toBe(true);
        expect(state.error).toBeNull();
    });

    it('keeps the last success timestamp when a refetch fails, together with the stale data it describes', () => {
        const state = stakeDataReducer(
            { ...stateAfterPreviousSuccess(), isLoading: true },
            stakeDataActions.fetchStakeDataFailure('Network down'),
        );

        expect(state.lastSuccessAt).toBe(LAST_SUCCESS_AT);
        expect(state.data).toEqual(stateAfterPreviousSuccess().data);
        expect(state.error).toBe('Network down');
        expect(state.isLoading).toBe(false);
    });

    it('advances the last success timestamp only when data is actually verified fresh', () => {
        jest.useFakeTimers().setSystemTime(TWO_MINUTES_LATER);

        const state = stakeDataReducer(
            { ...stateAfterPreviousSuccess(), isLoading: true },
            stakeDataActions.fetchStakeDataSuccess([solSection]),
        );

        expect(state.lastSuccessAt).toBe(TWO_MINUTES_LATER);
        expect(state.data.sol?.stats.apy).toBe(solSection.stats.apy);
        expect(state.error).toBeNull();
        expect(state.isLoading).toBe(false);
    });

    it('clears the last success timestamp on reset, because reset clears the data it describes', () => {
        const state = stakeDataReducer(
            stateAfterPreviousSuccess(),
            stakeDataActions.fetchStakeDataReset(),
        );

        expect(state.lastSuccessAt).toBeNull();
        expect(state.data).toEqual(stakeDataInitialState.data);
    });
});
