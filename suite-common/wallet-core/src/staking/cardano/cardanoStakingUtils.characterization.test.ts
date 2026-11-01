import type { AccountWithNetworkType } from '@suite-common/wallet-types';
import {
    type CardanoStakingScenario,
    MOCK_CARDANO_EVERSTAKE_DREP_ID,
    MOCK_CARDANO_EVERSTAKE_OTHER_POOL,
    MOCK_CARDANO_EVERSTAKE_POOL,
    MOCK_CARDANO_EXTERNAL_POOL,
    MOCK_CARDANO_FIVE_BINARIES_POOL,
    mockCardanoStakingAccount,
} from '@suite-common/wallet-types/mocks';

import {
    selectCardanoPoolsInfo,
    selectFirstCardanoAccountStakedWithFiveBinaries,
    selectIsCardanoStakedOutsideEverstake,
    selectIsCardanoStakedWithFiveBinaries,
} from './cardanoStakingSelectors';
import {
    getCardanoAccountDrepId,
    getCardanoAccountPoolId,
    getCardanoCurrentVotingOption,
    hasCardanoLiveVoteDelegation,
    isCardanoStakedWithEverstake,
    isCardanoWithdrawalBlockedByMissingDrep,
    selectBestCardanoPool,
} from './cardanoStakingUtils';
import { mockStakeData, mockStakeRootState } from '../../../mocks';
import { selectAdaAccountHasStaked } from '../../accounts/accountsSelectors';

const readCardanoStakingDetails = (account: AccountWithNetworkType<'cardano'>) => {
    const state = mockStakeRootState({ accounts: [account] });
    const pools = selectCardanoPoolsInfo(state);
    const poolId = getCardanoAccountPoolId(account);

    return {
        hasStaked: selectAdaAccountHasStaked(state, account.key),
        poolId,
        isStakedWithEverstake: isCardanoStakedWithEverstake(account, pools),
        isStakedOutsideEverstake: selectIsCardanoStakedOutsideEverstake(state, account.key),
        isStakedWithFiveBinaries: selectIsCardanoStakedWithFiveBinaries(state, account.key),
        drepId: getCardanoAccountDrepId(account),
        votingOption: getCardanoCurrentVotingOption(account),
        hasLiveVoteDelegation: hasCardanoLiveVoteDelegation(account),
        isWithdrawalBlockedByMissingDrep: isCardanoWithdrawalBlockedByMissingDrep(account),
        bestPool: selectBestCardanoPool(pools, poolId).bech32,
    };
};

type CardanoStakingDetails = ReturnType<typeof readCardanoStakingDetails>;

const EVERSTAKE_DETAILS: CardanoStakingDetails = {
    hasStaked: true,
    poolId: MOCK_CARDANO_EVERSTAKE_POOL,
    isStakedWithEverstake: true,
    isStakedOutsideEverstake: false,
    isStakedWithFiveBinaries: false,
    drepId: MOCK_CARDANO_EVERSTAKE_DREP_ID,
    votingOption: { type: 'everstake' },
    hasLiveVoteDelegation: true,
    isWithdrawalBlockedByMissingDrep: false,
    bestPool: MOCK_CARDANO_EVERSTAKE_POOL,
};

describe('cardano staking details characterization', () => {
    it.each<{ scenario: CardanoStakingScenario; expected: CardanoStakingDetails }>([
        {
            scenario: 'notDelegated',
            expected: {
                ...EVERSTAKE_DETAILS,
                hasStaked: false,
                poolId: null,
                isStakedWithEverstake: false,
                drepId: null,
                votingOption: undefined,
                hasLiveVoteDelegation: false,
            },
        },
        { scenario: 'everstake', expected: EVERSTAKE_DETAILS },
        { scenario: 'everstakeNoRewards', expected: EVERSTAKE_DETAILS },
        {
            scenario: 'everstakeOtherPool',
            expected: {
                ...EVERSTAKE_DETAILS,
                poolId: MOCK_CARDANO_EVERSTAKE_OTHER_POOL,
                bestPool: MOCK_CARDANO_EVERSTAKE_OTHER_POOL,
            },
        },
        {
            scenario: 'everstakeMissingDrep',
            expected: {
                ...EVERSTAKE_DETAILS,
                drepId: null,
                votingOption: undefined,
                hasLiveVoteDelegation: false,
                isWithdrawalBlockedByMissingDrep: true,
            },
        },
        {
            scenario: 'everstakeAbstainDrep',
            expected: {
                ...EVERSTAKE_DETAILS,
                drepId: 'drep_always_abstain',
                votingOption: { type: 'abstain' },
            },
        },
        {
            scenario: 'fiveBinaries',
            expected: {
                ...EVERSTAKE_DETAILS,
                poolId: MOCK_CARDANO_FIVE_BINARIES_POOL,
                isStakedWithEverstake: false,
                isStakedOutsideEverstake: true,
                isStakedWithFiveBinaries: true,
            },
        },
        {
            scenario: 'externalPool',
            expected: {
                ...EVERSTAKE_DETAILS,
                poolId: MOCK_CARDANO_EXTERNAL_POOL,
                isStakedWithEverstake: false,
                isStakedOutsideEverstake: true,
                drepId: null,
                votingOption: undefined,
                hasLiveVoteDelegation: false,
                isWithdrawalBlockedByMissingDrep: true,
            },
        },
    ])('$scenario', ({ scenario, expected }) => {
        expect(readCardanoStakingDetails(mockCardanoStakingAccount(scenario))).toEqual(expected);
    });

    it('finds the first account staked with FiveBinaries', () => {
        const fiveBinariesAccount = mockCardanoStakingAccount('fiveBinaries');
        const state = mockStakeRootState({
            accounts: [mockCardanoStakingAccount('everstake'), fiveBinariesAccount],
        });

        expect(selectFirstCardanoAccountStakedWithFiveBinaries(state)).toBe(fiveBinariesAccount);
    });

    it('reads Everstake pools from staking API data', () => {
        const state = mockStakeRootState({ accounts: [] });

        expect(selectCardanoPoolsInfo(state)).toEqual(mockStakeData().ada?.pools);
    });

    it('falls back to the default Everstake pool without staking API data', () => {
        expect(selectBestCardanoPool(undefined, null).bech32).toBe(MOCK_CARDANO_EVERSTAKE_POOL);
    });
});
