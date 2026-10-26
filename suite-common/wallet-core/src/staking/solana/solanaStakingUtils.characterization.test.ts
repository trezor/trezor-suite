import type { AccountWithNetworkType } from '@suite-common/wallet-types';
import {
    type SolanaStakingScenario,
    mockSolanaStakingAccount,
} from '@suite-common/wallet-types/mocks';

import { getSolanaDeactivatedRentReserves } from './solanaStakingLimitUtils';
import {
    type SolanaUnstakeAmountBounds,
    getSolanaUnstakeAmountBounds,
    getStakingAccountCurrentStatus,
} from './solanaStakingUtils';
import { mockStakeRootState } from '../../../mocks';
import {
    selectHasSolExternalStakingAccounts,
    selectSolAccountHasStaked,
    selectSolExternalStakingAccountsTotalStaked,
} from '../../accounts/accountsSelectors';

const UNSTAKE_AMOUNTS = ['0.5', '1', '3', '5', '6'];

const readSolanaStakingDetails = (account: AccountWithNetworkType<'solana'>) => {
    const state = mockStakeRootState({ accounts: [account] });

    return {
        hasStaked: selectSolAccountHasStaked(state, account.key),
        hasExternalStakingAccounts: selectHasSolExternalStakingAccounts(state, account.key),
        externalStakingAccountsTotalStaked: selectSolExternalStakingAccountsTotalStaked(
            state,
            account.key,
        ),
        currentStatus: getStakingAccountCurrentStatus(account),
        deactivatedRentReserves: getSolanaDeactivatedRentReserves(account),
        unstakeAmountBounds: UNSTAKE_AMOUNTS.map(amount =>
            getSolanaUnstakeAmountBounds(account, amount),
        ),
    };
};

type SolanaStakingDetails = ReturnType<typeof readSolanaStakingDetails>;

const NO_BOUNDS: (SolanaUnstakeAmountBounds | null)[] = [null, null, null, null, null];
const SPLIT_BELOW_MINIMUM_BOUNDS: (SolanaUnstakeAmountBounds | null)[] = [
    { closestHigher: '1' },
    null,
    null,
    null,
    null,
];

const NOT_STAKED_DETAILS: SolanaStakingDetails = {
    hasStaked: false,
    hasExternalStakingAccounts: false,
    externalStakingAccountsTotalStaked: '0',
    currentStatus: null,
    deactivatedRentReserves: [],
    unstakeAmountBounds: NO_BOUNDS,
};

describe('solana staking details characterization', () => {
    it.each<{ scenario: SolanaStakingScenario; expected: SolanaStakingDetails }>([
        { scenario: 'none', expected: NOT_STAKED_DETAILS },
        {
            scenario: 'activating',
            expected: { ...NOT_STAKED_DETAILS, hasStaked: true, currentStatus: 'activating' },
        },
        {
            scenario: 'active',
            expected: {
                ...NOT_STAKED_DETAILS,
                hasStaked: true,
                unstakeAmountBounds: SPLIT_BELOW_MINIMUM_BOUNDS,
            },
        },
        { scenario: 'deactivating', expected: { ...NOT_STAKED_DETAILS, hasStaked: true } },
        {
            scenario: 'deactivated',
            expected: {
                ...NOT_STAKED_DETAILS,
                hasStaked: true,
                deactivatedRentReserves: ['2282880'],
            },
        },
        {
            scenario: 'mixed',
            expected: {
                ...NOT_STAKED_DETAILS,
                hasStaked: true,
                currentStatus: 'inactive',
                deactivatedRentReserves: ['2282880'],
                unstakeAmountBounds: SPLIT_BELOW_MINIMUM_BOUNDS,
            },
        },
        {
            scenario: 'externalOnly',
            expected: {
                ...NOT_STAKED_DETAILS,
                hasExternalStakingAccounts: true,
                externalStakingAccountsTotalStaked: '10000000000',
            },
        },
        {
            scenario: 'everstakeAndExternal',
            expected: {
                ...NOT_STAKED_DETAILS,
                hasStaked: true,
                hasExternalStakingAccounts: true,
                externalStakingAccountsTotalStaked: '11000000000',
                unstakeAmountBounds: SPLIT_BELOW_MINIMUM_BOUNDS,
            },
        },
    ])('$scenario', ({ scenario, expected }) => {
        expect(readSolanaStakingDetails(mockSolanaStakingAccount(scenario))).toEqual(expected);
    });
});
