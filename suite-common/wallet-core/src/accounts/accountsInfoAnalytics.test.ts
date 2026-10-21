import {
    EVERSTAKE_POOLS,
    FIVE_BINARIES_POOLS,
    LUGANODES_TRON_SRS,
    P2P_ORG_TRON_SRS,
    asNetworkSymbol,
} from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { EVERSTAKE_CONTRACTS } from '@trezor/network-ethereum/staking';
import { EVERSTAKE_VOTER_PUBKEYS, StakeState } from '@trezor/network-solana/constants';
import { type DeepPartial } from '@trezor/type-utils';
import { mergeDeepObject } from '@trezor/utils';

import { getAccountInfoAnalyticsPayload } from './accountsInfoAnalytics';

const mockAccount = (
    account: Parameters<typeof mockWalletAccount>[0],
    networkSpecific: DeepPartial<Account> = {},
): Account => mergeDeepObject(mockWalletAccount(account), networkSpecific) as Account;

const solStake = {
    status: StakeState.Active,
    stake: '1000000000',
    rentExemptReserve: '2282880',
    voterPubkey: EVERSTAKE_VOTER_PUBKEYS[0],
};

const ethPool = {
    contract: EVERSTAKE_CONTRACTS[1].accounting,
    name: 'Everstake',
    pendingBalance: '0',
    pendingDepositedBalance: '0',
    depositedBalance: '0',
    withdrawTotalAmount: '0',
    claimableAmount: '0',
    restakedReward: '0',
    autocompoundBalance: '0',
};

const getStakingPayload = (account: ReturnType<typeof mockWalletAccount>) => {
    const { hasStaked, stakingProviders } = getAccountInfoAnalyticsPayload(
        account,
        undefined,
        false,
    );

    return { hasStaked, stakingProviders };
};

describe('accounts/info staking attributes', () => {
    it('detects an external-only Solana delegation without reporting its validator address', () => {
        const account = mockAccount(
            { symbol: asNetworkSymbol('sol') },
            {
                networkType: 'solana',
                misc: {
                    solStakingAccounts: [],
                    solExternalStakingAccounts: [
                        { ...solStake, voterPubkey: 'external-validator' },
                    ],
                },
            },
        );

        expect(getStakingPayload(account)).toEqual({
            hasStaked: true,
            stakingProviders: ['unknown'],
        });
    });

    it('ignores an emptied Solana delegation when identifying providers', () => {
        const account = mockAccount(
            { symbol: asNetworkSymbol('sol') },
            {
                networkType: 'solana',
                misc: {
                    solStakingAccounts: [solStake],
                    solExternalStakingAccounts: [
                        { ...solStake, stake: '0', voterPubkey: 'old-validator' },
                    ],
                },
            },
        );

        expect(getStakingPayload(account)).toEqual({
            hasStaked: true,
            stakingProviders: ['everstake'],
        });
    });

    it.each(Object.values(StakeState))('keeps a funded Solana position in state %s', status => {
        const account = mockAccount(
            { symbol: asNetworkSymbol('sol') },
            {
                networkType: 'solana',
                misc: { solStakingAccounts: [{ ...solStake, status }, solStake] },
            },
        );

        expect(getStakingPayload(account)).toEqual({
            hasStaked: true,
            stakingProviders: ['everstake'],
        });
    });

    it('does not count empty Solana delegations or rent reserves as stake', () => {
        const account = mockAccount(
            { symbol: asNetworkSymbol('sol') },
            {
                networkType: 'solana',
                misc: {
                    solStakingAccounts: [{ ...solStake, stake: '0' }],
                    solExternalStakingAccounts: [
                        { ...solStake, stake: undefined, voterPubkey: 'external-validator' },
                    ],
                },
            },
        );

        expect(getStakingPayload(account)).toEqual({ hasStaked: false, stakingProviders: [] });
    });

    it.each([
        'autocompoundBalance',
        'pendingBalance',
        'pendingDepositedBalance',
        'withdrawTotalAmount',
    ] as const)('counts an Ethereum position with only %s', field => {
        const account = mockAccount(
            { symbol: asNetworkSymbol('eth') },
            {
                networkType: 'ethereum',
                misc: { stakingPools: [{ ...ethPool, [field]: '1000000000000000' }] },
            },
        );

        expect(getStakingPayload(account)).toEqual({
            hasStaked: true,
            stakingProviders: ['everstake'],
        });
    });

    it('stops reporting an Ethereum provider after all current balances are withdrawn', () => {
        const account = mockAccount(
            { symbol: asNetworkSymbol('eth') },
            {
                networkType: 'ethereum',
                misc: { stakingPools: [{ ...ethPool, depositedBalance: '1000000000000000' }] },
            },
        );

        expect(getStakingPayload(account)).toEqual({ hasStaked: false, stakingProviders: [] });
    });

    it.each([
        { poolId: EVERSTAKE_POOLS[0], provider: 'everstake' },
        { poolId: FIVE_BINARIES_POOLS[0], provider: 'fivebinaries' },
        { poolId: 'external-pool', provider: 'unknown' },
    ])('identifies Cardano pool $provider', ({ poolId, provider }) => {
        const account = mockAccount(
            { symbol: asNetworkSymbol('ada'), balance: '10000000' },
            { networkType: 'cardano', misc: { staking: { isActive: true, poolId } } },
        );

        expect(getStakingPayload(account)).toEqual({
            hasStaked: true,
            stakingProviders: [provider],
        });
    });

    it('does not report deregistered Cardano stake despite a retained pool ID', () => {
        const account = mockAccount(
            { symbol: asNetworkSymbol('ada'), balance: '10000000' },
            {
                networkType: 'cardano',
                misc: { staking: { isActive: false, poolId: EVERSTAKE_POOLS[0] } },
            },
        );

        expect(getStakingPayload(account)).toEqual({ hasStaked: false, stakingProviders: [] });
    });

    it.each([
        { votes: [], providers: [] },
        {
            votes: [
                { address: LUGANODES_TRON_SRS[0], voteCount: '1' },
                { address: P2P_ORG_TRON_SRS[0], voteCount: '1' },
            ],
            providers: ['luganodes', 'p2p.org'],
        },
        { votes: [{ address: 'external-representative', voteCount: '1' }], providers: ['unknown'] },
    ])(
        'reports Tron stake independently of vote allocation ($providers)',
        ({ votes, providers }) => {
            const account = mockAccount(
                { symbol: asNetworkSymbol('trx') },
                {
                    networkType: 'tron',
                    misc: { tronResources: { stakingInfo: { stakedBalance: '2000000', votes } } },
                },
            );

            expect(getStakingPayload(account)).toEqual({
                hasStaked: true,
                stakingProviders: providers,
            });
        },
    );

    it('excludes Tron unstaking-only balances from active stake', () => {
        const account = mockAccount(
            { symbol: asNetworkSymbol('trx') },
            {
                networkType: 'tron',
                misc: {
                    tronResources: {
                        stakingInfo: {
                            stakedBalance: '0',
                            votes: [],
                            unstakingBatches: [{ amount: '1000000', expireTime: 1 }],
                        },
                    },
                },
            },
        );

        expect(getStakingPayload(account)).toEqual({ hasStaked: false, stakingProviders: [] });
    });

    it('does not infer staking from a non-staking account balance', () => {
        const account = mockAccount({ symbol: asNetworkSymbol('btc'), balance: '100000000' });

        expect(getStakingPayload(account)).toEqual({ hasStaked: false, stakingProviders: [] });
    });
});
