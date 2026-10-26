import { asNetworkSymbol } from '@suite-common/wallet-config';
import type { Account, AccountKey } from '@suite-common/wallet-types';
import {
    type CardanoStakingScenario,
    type EthereumStakingScenario,
    MOCK_STAKING_NOW_SECONDS,
    type SolanaStakingScenario,
    type TronStakingScenario,
    mockAccountKey,
    mockCardanoStakingAccount,
    mockEthereumStakingAccount,
    mockSolanaStakingAccount,
    mockTronStakingAccount,
    mockWalletAccount,
} from '@suite-common/wallet-types/mocks';

import type { StakeRootState } from './stakingReducerTypes';
import {
    getAccountCryptoBalanceWithStaking,
    selectAccountHasStaking,
    selectApy,
    selectCanClaimByAccountKey,
    selectClaimableAmountByAccountKey,
    selectEntryPeriodInDaysBySymbol,
    selectHasAnyDeviceAccountsWithStaking,
    selectIsStakeConfirmingByAccountKey,
    selectIsStakePendingByAccountKey,
    selectRewardsBalanceByAccountKey,
    selectStakedBalanceByAccountKey,
    selectTotalStakePendingByAccountKey,
    selectUnstakableBalanceByAccountKey,
    selectUnstakingBalanceByAccountKey,
    selectUnstakingPeriodInDaysByAccountKey,
} from './stakingSelectors';
import { mockEthereumStakingTransaction, mockStakeRootState } from '../../mocks';
import { selectAccountByKey } from '../accounts/accountsSelectors';

const readStakingSelectors = (state: StakeRootState, accountKey: AccountKey) => ({
    hasStaking: selectAccountHasStaking(state, accountKey),
    isStakePending: selectIsStakePendingByAccountKey(state, accountKey),
    isStakeConfirming: selectIsStakeConfirmingByAccountKey(state, accountKey),
    apy: selectApy(state, { accountKey }),
    staked: selectStakedBalanceByAccountKey(state, accountKey),
    unstakable: selectUnstakableBalanceByAccountKey(state, accountKey),
    rewards: selectRewardsBalanceByAccountKey(state, accountKey),
    totalStakePending: selectTotalStakePendingByAccountKey(state, accountKey),
    claimable: selectClaimableAmountByAccountKey(state, accountKey),
    canClaim: selectCanClaimByAccountKey(state, accountKey),
    unstaking: selectUnstakingBalanceByAccountKey(state, accountKey),
    unstakingPeriodInDays: selectUnstakingPeriodInDaysByAccountKey(state, accountKey),
    cryptoBalanceWithStaking: getAccountCryptoBalanceWithStaking(
        selectAccountByKey(state, accountKey),
    ),
});

type StakingSelectorsReading = ReturnType<typeof readStakingSelectors>;

const readAccount = (account: Account) =>
    readStakingSelectors(mockStakeRootState({ accounts: [account] }), account.key);

const ETHEREUM_EMPTY_READING: StakingSelectorsReading = {
    hasStaking: false,
    isStakePending: false,
    isStakeConfirming: false,
    apy: 3.08,
    staked: '0',
    unstakable: '0',
    rewards: '0',
    totalStakePending: '0',
    claimable: '0',
    canClaim: false,
    unstaking: '0',
    unstakingPeriodInDays: 3,
    cryptoBalanceWithStaking: '1.5',
};

const ETHEREUM_ACTIVE_READING: StakingSelectorsReading = {
    ...ETHEREUM_EMPTY_READING,
    hasStaking: true,
    staked: '2',
    unstakable: '2.05',
    rewards: '0.05',
    cryptoBalanceWithStaking: '3.55',
};

const SOLANA_EMPTY_READING: StakingSelectorsReading = {
    hasStaking: false,
    isStakePending: false,
    isStakeConfirming: false,
    apy: 6.24,
    staked: '0',
    unstakable: '0',
    rewards: '0.000000000',
    totalStakePending: '0',
    claimable: '0',
    canClaim: false,
    unstaking: '0',
    unstakingPeriodInDays: 1,
    cryptoBalanceWithStaking: '2.5',
};

const CARDANO_STAKED_READING: StakingSelectorsReading = {
    hasStaking: true,
    isStakePending: false,
    isStakeConfirming: false,
    apy: 2.06,
    staked: '1000',
    unstakable: '1000',
    rewards: '5.25',
    totalStakePending: '0',
    claimable: '0',
    canClaim: false,
    unstaking: '0',
    unstakingPeriodInDays: 5,
    cryptoBalanceWithStaking: '1000',
};

const TRON_STAKED_READING: StakingSelectorsReading = {
    hasStaking: true,
    isStakePending: false,
    isStakeConfirming: false,
    apy: null,
    staked: '1000',
    unstakable: '1000',
    rewards: '1.5',
    totalStakePending: '0',
    claimable: '0',
    canClaim: false,
    unstaking: '0',
    unstakingPeriodInDays: 14,
    cryptoBalanceWithStaking: '1500',
};

const NO_STAKING_READING: StakingSelectorsReading = {
    hasStaking: false,
    isStakePending: false,
    isStakeConfirming: false,
    apy: null,
    staked: '0',
    unstakable: '0',
    rewards: '0',
    totalStakePending: '0',
    claimable: '0',
    canClaim: false,
    unstaking: '0',
    unstakingPeriodInDays: null,
    cryptoBalanceWithStaking: '0',
};

describe('staking selectors characterization', () => {
    beforeAll(() => {
        jest.useFakeTimers().setSystemTime(MOCK_STAKING_NOW_SECONDS * 1000);
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    describe('Ethereum', () => {
        it.each<{ scenario: EthereumStakingScenario; expected: StakingSelectorsReading }>([
            { scenario: 'none', expected: ETHEREUM_EMPTY_READING },
            {
                scenario: 'pending',
                expected: {
                    ...ETHEREUM_EMPTY_READING,
                    hasStaking: true,
                    isStakePending: true,
                    totalStakePending: '0.75',
                    cryptoBalanceWithStaking: '2.25',
                },
            },
            {
                scenario: 'pendingDeposited',
                expected: {
                    ...ETHEREUM_EMPTY_READING,
                    hasStaking: true,
                    isStakePending: true,
                    totalStakePending: '0.25',
                    cryptoBalanceWithStaking: '1.75',
                },
            },
            { scenario: 'active', expected: ETHEREUM_ACTIVE_READING },
            {
                scenario: 'unstaking',
                expected: {
                    ...ETHEREUM_EMPTY_READING,
                    hasStaking: true,
                    staked: '1',
                    unstakable: '1.02',
                    rewards: '0.02',
                    unstaking: '0.5',
                    cryptoBalanceWithStaking: '3.02',
                },
            },
            {
                scenario: 'claimable',
                expected: {
                    ...ETHEREUM_EMPTY_READING,
                    hasStaking: true,
                    staked: '1',
                    unstakable: '1.02',
                    rewards: '0.02',
                    claimable: '0.5',
                    canClaim: true,
                    unstaking: '0.5',
                    cryptoBalanceWithStaking: '3.02',
                },
            },
            {
                scenario: 'partiallyClaimable',
                expected: {
                    ...ETHEREUM_EMPTY_READING,
                    hasStaking: true,
                    claimable: '0.2',
                    unstaking: '0.5',
                    cryptoBalanceWithStaking: '2',
                },
            },
            { scenario: 'otherPool', expected: ETHEREUM_EMPTY_READING },
        ])('$scenario', ({ scenario, expected }) => {
            expect(readAccount(mockEthereumStakingAccount(scenario))).toEqual(expected);
        });

        it('confirming stake transaction', () => {
            const account = mockEthereumStakingAccount('active');
            const state = mockStakeRootState({
                accounts: [account],
                transactions: {
                    [account.key]: [
                        mockEthereumStakingTransaction({
                            account,
                            stakeType: 'stake',
                            isPending: true,
                        }),
                    ],
                },
            });

            expect(readStakingSelectors(state, account.key)).toEqual({
                ...ETHEREUM_ACTIVE_READING,
                isStakeConfirming: true,
            });
        });

        it('confirmed stake transaction', () => {
            const account = mockEthereumStakingAccount('active');
            const state = mockStakeRootState({
                accounts: [account],
                transactions: {
                    [account.key]: [
                        mockEthereumStakingTransaction({
                            account,
                            stakeType: 'stake',
                            isPending: false,
                        }),
                    ],
                },
            });

            expect(readStakingSelectors(state, account.key)).toEqual(ETHEREUM_ACTIVE_READING);
        });

        it('Hoodi testnet', () => {
            const account = mockEthereumStakingAccount('active', {
                symbol: asNetworkSymbol('thod'),
            });

            expect(readAccount(account)).toEqual({ ...ETHEREUM_ACTIVE_READING, apy: null });
        });
    });

    describe('Solana', () => {
        it.each<{ scenario: SolanaStakingScenario; expected: StakingSelectorsReading }>([
            { scenario: 'none', expected: SOLANA_EMPTY_READING },
            {
                scenario: 'activating',
                expected: {
                    ...SOLANA_EMPTY_READING,
                    hasStaking: true,
                    isStakePending: true,
                    totalStakePending: '2',
                    cryptoBalanceWithStaking: '4.5',
                },
            },
            {
                scenario: 'active',
                expected: {
                    ...SOLANA_EMPTY_READING,
                    hasStaking: true,
                    staked: '5',
                    unstakable: '5',
                    rewards: '0.000854795',
                    cryptoBalanceWithStaking: '7.5',
                },
            },
            {
                scenario: 'deactivating',
                expected: {
                    ...SOLANA_EMPTY_READING,
                    hasStaking: true,
                    rewards: '0.000341918',
                    unstaking: '2',
                    cryptoBalanceWithStaking: '4.5',
                },
            },
            {
                scenario: 'deactivated',
                expected: {
                    ...SOLANA_EMPTY_READING,
                    hasStaking: true,
                    claimable: '1.5',
                    canClaim: true,
                    cryptoBalanceWithStaking: '4',
                },
            },
            {
                scenario: 'mixed',
                expected: {
                    ...SOLANA_EMPTY_READING,
                    hasStaking: true,
                    isStakePending: true,
                    staked: '4',
                    unstakable: '4',
                    rewards: '0.001025753',
                    totalStakePending: '1',
                    claimable: '0.5',
                    canClaim: true,
                    unstaking: '2',
                    cryptoBalanceWithStaking: '10.3',
                },
            },
            { scenario: 'externalOnly', expected: SOLANA_EMPTY_READING },
            {
                scenario: 'everstakeAndExternal',
                expected: {
                    ...SOLANA_EMPTY_READING,
                    hasStaking: true,
                    staked: '5',
                    unstakable: '5',
                    rewards: '0.000854795',
                    cryptoBalanceWithStaking: '7.5',
                },
            },
        ])('$scenario', ({ scenario, expected }) => {
            expect(readAccount(mockSolanaStakingAccount(scenario))).toEqual(expected);
        });

        it('devnet', () => {
            const account = mockSolanaStakingAccount('active', { symbol: asNetworkSymbol('dsol') });

            expect(readAccount(account)).toEqual({
                ...SOLANA_EMPTY_READING,
                hasStaking: true,
                apy: null,
                staked: '5',
                unstakable: '5',
                rewards: '0',
                cryptoBalanceWithStaking: '7.5',
            });
        });
    });

    describe('Cardano', () => {
        it.each<{ scenario: CardanoStakingScenario; expected: StakingSelectorsReading }>([
            {
                scenario: 'notDelegated',
                expected: {
                    ...CARDANO_STAKED_READING,
                    hasStaking: false,
                    staked: '0',
                    unstakable: '0',
                    rewards: '0',
                },
            },
            { scenario: 'everstake', expected: CARDANO_STAKED_READING },
            {
                scenario: 'everstakeNoRewards',
                expected: { ...CARDANO_STAKED_READING, rewards: '0' },
            },
            {
                scenario: 'everstakeOtherPool',
                expected: { ...CARDANO_STAKED_READING, apy: 2.4, rewards: '1' },
            },
            { scenario: 'everstakeMissingDrep', expected: CARDANO_STAKED_READING },
            { scenario: 'everstakeAbstainDrep', expected: CARDANO_STAKED_READING },
            {
                scenario: 'fiveBinaries',
                expected: { ...CARDANO_STAKED_READING, apy: null, rewards: '1' },
            },
            {
                scenario: 'externalPool',
                expected: { ...CARDANO_STAKED_READING, apy: null, rewards: '2' },
            },
        ])('$scenario', ({ scenario, expected }) => {
            expect(readAccount(mockCardanoStakingAccount(scenario))).toEqual(expected);
        });
    });

    describe('Tron', () => {
        it.each<{ scenario: TronStakingScenario; expected: StakingSelectorsReading }>([
            {
                scenario: 'none',
                expected: {
                    ...TRON_STAKED_READING,
                    hasStaking: false,
                    staked: '',
                    unstakable: '',
                    rewards: '0',
                    cryptoBalanceWithStaking: '500',
                },
            },
            { scenario: 'frozenNotVoted', expected: { ...TRON_STAKED_READING, rewards: '0' } },
            { scenario: 'votedLuganodes', expected: TRON_STAKED_READING },
            { scenario: 'votedSplit', expected: TRON_STAKED_READING },
            { scenario: 'votedExternal', expected: TRON_STAKED_READING },
            {
                scenario: 'unstakingPending',
                expected: {
                    ...TRON_STAKED_READING,
                    staked: '500',
                    unstakable: '500',
                    cryptoBalanceWithStaking: '1000',
                },
            },
            {
                scenario: 'unstakingWithdrawable',
                expected: {
                    ...TRON_STAKED_READING,
                    staked: '500',
                    unstakable: '500',
                    unstaking: '300',
                    cryptoBalanceWithStaking: '1000',
                },
            },
            { scenario: 'rewardsOnCooldown', expected: { ...TRON_STAKED_READING, rewards: '2' } },
        ])('$scenario', ({ scenario, expected }) => {
            expect(readAccount(mockTronStakingAccount(scenario))).toEqual(expected);
        });
    });

    describe('accounts without staking', () => {
        it('network without staking', () => {
            expect(readAccount(mockWalletAccount({ symbol: asNetworkSymbol('btc') }))).toEqual(
                NO_STAKING_READING,
            );
        });

        it('unknown account key', () => {
            const state = mockStakeRootState({ accounts: [mockEthereumStakingAccount('active')] });

            expect(readStakingSelectors(state, mockAccountKey({ descriptor: 'unknown' }))).toEqual(
                NO_STAKING_READING,
            );
        });
    });

    describe('network-level selectors', () => {
        const stakedState = mockStakeRootState({
            accounts: [
                mockEthereumStakingAccount('active'),
                mockSolanaStakingAccount('active'),
                mockCardanoStakingAccount('everstake'),
                mockTronStakingAccount('votedLuganodes'),
            ],
        });
        const notStakedState = mockStakeRootState({
            accounts: [
                mockEthereumStakingAccount('none'),
                mockSolanaStakingAccount('none'),
                mockCardanoStakingAccount('notDelegated'),
                mockTronStakingAccount('none'),
            ],
        });

        it.each([
            { symbol: 'eth', hasAnyStaked: true, entryPeriodInDays: 4, apy: 3.08 },
            { symbol: 'thod', hasAnyStaked: true, entryPeriodInDays: 4, apy: null },
            { symbol: 'sol', hasAnyStaked: true, entryPeriodInDays: 1, apy: 6.24 },
            { symbol: 'dsol', hasAnyStaked: true, entryPeriodInDays: 1, apy: null },
            { symbol: 'ada', hasAnyStaked: true, entryPeriodInDays: undefined, apy: 2.06 },
            { symbol: 'trx', hasAnyStaked: true, entryPeriodInDays: undefined, apy: null },
            { symbol: 'btc', hasAnyStaked: false, entryPeriodInDays: undefined, apy: null },
        ])('$symbol', ({ symbol, hasAnyStaked, entryPeriodInDays, apy }) => {
            const networkSymbol = asNetworkSymbol(symbol);

            expect({
                hasAnyStaked: selectHasAnyDeviceAccountsWithStaking(stakedState, networkSymbol),
                hasAnyNotStaked: selectHasAnyDeviceAccountsWithStaking(
                    notStakedState,
                    networkSymbol,
                ),
                entryPeriodInDays: selectEntryPeriodInDaysBySymbol(stakedState, networkSymbol),
                apy: selectApy(stakedState, { networkSymbol }),
            }).toEqual({ hasAnyStaked, hasAnyNotStaked: false, entryPeriodInDays, apy });
        });
    });
});
