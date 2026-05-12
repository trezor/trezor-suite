import { stakeDataSlice } from '../stakeDataSlice';
import type { StakeDataState } from '../stakeDataSlice';
import { stakeInitialState } from '../stakeReducer';
import type { StakeRootState } from '../stakeReducerTypes';
import { selectCardanoPoolsInfo, selectEthNextRewardPayout } from '../stakeSelectors';

const stakeDataInitialState = stakeDataSlice.getInitialState();

const buildStakeState = (data: Partial<StakeDataState['data']>): StakeRootState => ({
    wallet: {
        stake: {
            ...stakeInitialState,
            data: {
                ...stakeDataInitialState,
                data: { ...stakeDataInitialState.data, ...data },
            },
        },
    },
});

describe('selectEthNextRewardPayout', () => {
    const createState = (nextRewardPayout?: number) =>
        buildStakeState({
            eth: nextRewardPayout
                ? { stats: { apy: 0, nextRewardPayout }, validators: {} }
                : undefined,
        });

    it('returns null when next reward payout is unavailable', () => {
        expect(selectEthNextRewardPayout(createState())).toBeNull();
    });

    it('returns at least 1 day for positive payout values below 1 day', () => {
        expect(selectEthNextRewardPayout(createState(60 * 60))).toBe(1);
    });

    it('returns rounded day value for payout values over 1 day', () => {
        expect(selectEthNextRewardPayout(createState(2.2 * 24 * 60 * 60))).toBe(2);
    });
});

describe('selectCardanoPoolsInfo', () => {
    type AdaPools = NonNullable<StakeDataState['data']['ada']>['pools'];

    const createState = (pools?: AdaPools) =>
        buildStakeState({
            ada: pools === undefined ? undefined : { pools },
        });

    it('returns a stable empty array reference when ada data is missing', () => {
        const stateA = createState();
        const stateB = createState();

        expect(selectCardanoPoolsInfo(stateA)).toBe(selectCardanoPoolsInfo(stateB));
    });

    it('returns a stable empty array reference when pools array is empty', () => {
        const stateA = createState([]);
        const stateB = createState([]);

        expect(selectCardanoPoolsInfo(stateA)).toBe(selectCardanoPoolsInfo(stateB));
    });

    it('returns the underlying pools array when populated', () => {
        const pools: AdaPools = [{ apy: 1, saturation: 50, id: 'pool1' }];
        const state = createState(pools);

        expect(selectCardanoPoolsInfo(state)).toBe(pools);
    });
});
