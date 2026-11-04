import { asNetworkSymbol } from '@suite-common/wallet-config';
import { MOCK_CARDANO_EVERSTAKE_POOL, mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { selectPoolStatsApy } from '../shared/stakingSelectors';
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
        buttonRequestsByPath: {},
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

describe('Cardano pool APY', () => {
    it('shows zero for a registered key with no pool while retaining the offered network APY', () => {
        const account = mockWalletAccount({ symbol: asNetworkSymbol('ada') });
        const state = buildStakeState({
            ada: { pools: [{ id: MOCK_CARDANO_EVERSTAKE_POOL, apy: 2.5, saturation: 40 }] },
        });

        expect(selectPoolStatsApy(state, { account })).toBe(0);
        expect(selectPoolStatsApy(state, { networkSymbol: account.symbol })).toBe(2.5);
    });

    it('keeps the offered APY for an account that has never registered its stake key', () => {
        const account = mockWalletAccount(
            { symbol: asNetworkSymbol('ada') },
            { misc: { staking: { isActive: false } } },
        );
        const state = buildStakeState({
            ada: { pools: [{ id: MOCK_CARDANO_EVERSTAKE_POOL, apy: 2.5, saturation: 40 }] },
        });

        expect(selectPoolStatsApy(state, { account })).toBe(2.5);
    });
});
