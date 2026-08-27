import { type AccountKey } from '@suite-common/wallet-types';

import { type AccountVotingDelegation } from './stakeActions';
import { DEFAULT_VOTING_OPTION } from './stakeConstants';
import { type StakeDataState, stakeDataInitialState } from './stakeDataSlice';
import { stakeInitialState } from './stakeReducer';
import type { StakeRootState } from './stakeReducerTypes';
import {
    selectCardanoPoolsInfo,
    selectEthNextRewardPayout,
    selectVotingDelegationOption,
} from './stakeSelectors';

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

describe('selectVotingDelegationOption', () => {
    const accountKey = 'descriptor-a-ada-session' as AccountKey;
    const otherAccountKey = 'descriptor-b-ada-session' as AccountKey;
    const anotherDrep: AccountVotingDelegation['option'] = {
        type: 'another_drep',
        drepId: 'drep1abc',
    };

    const createState = (votingDelegation?: AccountVotingDelegation): StakeRootState => ({
        wallet: { stake: { ...stakeInitialState, votingDelegation } },
    });

    it('falls back to Everstake when no option was confirmed', () => {
        expect(selectVotingDelegationOption(createState(), accountKey)).toEqual(
            DEFAULT_VOTING_OPTION,
        );
    });

    it('returns the option confirmed for the queried account', () => {
        const state = createState({ accountKey, option: anotherDrep });

        expect(selectVotingDelegationOption(state, accountKey)).toEqual(anotherDrep);
    });

    it('falls back to Everstake when the option belongs to another account', () => {
        const state = createState({ accountKey: otherAccountKey, option: anotherDrep });

        expect(selectVotingDelegationOption(state, accountKey)).toEqual(DEFAULT_VOTING_OPTION);
    });
});
