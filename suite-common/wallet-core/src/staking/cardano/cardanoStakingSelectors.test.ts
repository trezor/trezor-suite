import { type StakeDataState, stakeDataInitialState } from '../stakingDataSlice';
import { stakeInitialState } from '../stakingReducer';
import { type StakeRootState } from '../stakingReducerTypes';
import { selectCardanoPoolsInfo } from './cardanoStakingSelectors';

const buildStakeState = (data: Partial<StakeDataState['data']>): StakeRootState => ({
    wallet: {
        accounts: [],
        transactions: {
            transactions: {},
            phishing: {},
            fetchStatusDetail: {},
        },
        stake: {
            ...stakeInitialState,
            data: {
                ...stakeDataInitialState,
                data: { ...stakeDataInitialState.data, ...data },
            },
        },
    },
    device: {
        devices: [],
        persistentDeviceData: [],
    },
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
