import {
    type GetPositionParams,
    type StakingAccount,
    type StakingPositionBalances,
    stakingPositionSchema,
} from '@suite-common/earn-staking-common';
import { mockStakingTransaction } from '@suite-common/earn-staking-common/mocks';
import {
    MOCK_STAKING_NOW_SECONDS,
    MOCK_TRON_EXTERNAL_SR,
    MOCK_TRON_LUGANODES_SR,
    MOCK_TRON_P2P_ORG_SR,
    type TronStakingScenario,
    mockTronStakingAccount,
} from '@suite-common/wallet-types/mocks';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { getTronCuratedProductPosition } from './getTronCuratedProductPosition';
import {
    TRON_CURATED_MESSAGE_SYSTEM_FEATURES,
    createTronCuratedProductDescriptor,
} from './tronCuratedProductDescriptor';
import { getTronRepresentatives } from './tronRepresentatives';
import { luganodesProvider } from '../../providers/luganodes';
import { p2pProvider } from '../../providers/p2p';

const TRX = '000000';
const NOW_MS = MOCK_STAKING_NOW_SECONDS * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

type TronStakingInfo = NonNullable<
    NonNullable<NonNullable<StakingAccount['misc']>['tronResources']>['stakingInfo']
>;

const networkSymbol = asNetworkSymbol('trx');
const descriptor = createTronCuratedProductDescriptor({
    networkSymbol,
    messageSystemFeatures: TRON_CURATED_MESSAGE_SYSTEM_FEATURES,
});
const representatives = getTronRepresentatives({
    networkSymbol,
    providers: [luganodesProvider, p2pProvider],
});

type TestPositionParams = Pick<GetPositionParams, 'account'> & Partial<GetPositionParams>;

const getPosition = (params: TestPositionParams) =>
    getTronCuratedProductPosition({
        productInfo: null,
        transactions: [],
        ...params,
        descriptor,
        representatives,
    });

const getScenarioPosition = (scenario: TronStakingScenario) =>
    getPosition({ account: mockTronStakingAccount(scenario) });

const mockTronAccount = (stakingInfo: Partial<TronStakingInfo>): StakingAccount => {
    const account = mockTronStakingAccount('votedLuganodes');
    const { tronResources } = account.misc;

    if (tronResources?.stakingInfo === undefined) {
        throw new Error('Expected the votedLuganodes fixture to carry staking info');
    }

    return {
        ...account,
        misc: {
            ...account.misc,
            tronResources: {
                ...tronResources,
                stakingInfo: { ...tronResources.stakingInfo, ...stakingInfo },
            },
        },
    };
};

type ExpectedBalances = Record<keyof StakingPositionBalances, string>;

const balances = (values: Partial<ExpectedBalances>): ExpectedBalances => ({
    staked: '0',
    pending: '0',
    unstaking: '0',
    withdrawable: '0',
    rewards: '0',
    ...values,
});

describe('getTronCuratedProductPosition', () => {
    beforeAll(() => {
        jest.useFakeTimers().setSystemTime(NOW_MS);
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    it('derives the position of TRX frozen and voted for Luganodes', () => {
        const position = getScenarioPosition('votedLuganodes');

        expect(position).toEqual({
            productId: 'trx:trx:curated:native',
            status: 'active',
            lockup: 'locked',
            balances: balances({ staked: `1000${TRX}`, rewards: '1500000' }),
            unlocks: [],
            targets: [
                {
                    address: MOCK_TRON_LUGANODES_SR,
                    providerId: 'luganodes',
                    name: 'Luganodes',
                    amount: `1000${TRX}`,
                },
            ],
            operations: ['stake', 'unstake', 'claim', 'vote'],
            pendingTransactions: [],
            warnings: [],
            details: {
                kind: 'tron-staking',
                frozen: { energy: `1000${TRX}`, bandwidth: '0' },
                delegated: { energy: '0', bandwidth: '0' },
                votingPower: `1000${TRX}`,
                unallocatedVotingPower: '0',
                rewardClaimAvailableAt: null,
            },
            revalidateAt: null,
        });
        expect(stakingPositionSchema.safeParse(position).success).toBe(true);
    });

    it('derives no position for an account without staking info', () => {
        expect(getScenarioPosition('none')).toBeNull();
    });

    it('keeps unallocated voting power for a vote that never happened', () => {
        expect(getScenarioPosition('frozenNotVoted')).toMatchObject({
            balances: balances({ staked: `1000${TRX}` }),
            targets: [],
            operations: ['stake', 'unstake', 'vote'],
            details: { unallocatedVotingPower: `1000${TRX}` },
        });
    });

    it('attributes each vote to the provider of its representative', () => {
        expect(getScenarioPosition('votedSplit')?.targets).toEqual([
            {
                address: MOCK_TRON_LUGANODES_SR,
                providerId: 'luganodes',
                name: 'Luganodes',
                amount: `500${TRX}`,
            },
            {
                address: MOCK_TRON_P2P_ORG_SR,
                providerId: 'p2p.org',
                name: 'P2P.org',
                amount: `500${TRX}`,
            },
        ]);
    });

    it('attributes a vote for another representative to the external provider', () => {
        expect(getScenarioPosition('votedExternal')?.targets).toEqual([
            { address: MOCK_TRON_EXTERNAL_SR, providerId: 'external', amount: `1000${TRX}` },
        ]);
    });

    it('splits the unfreeze queue at the current time', () => {
        expect(getScenarioPosition('unstakingWithdrawable')).toMatchObject({
            balances: balances({
                staked: `500${TRX}`,
                unstaking: `200${TRX}`,
                withdrawable: `300${TRX}`,
                rewards: '1500000',
            }),
            unlocks: [{ amount: `200${TRX}`, availableAt: NOW_MS + 7 * DAY_MS }],
            operations: ['stake', 'unstake', 'withdraw', 'claim', 'vote'],
        });
    });

    it('makes a batch expiring now withdrawable', () => {
        expect(
            getPosition({
                account: mockTronAccount({
                    unstakingBatches: [{ amount: `5${TRX}`, expireTime: MOCK_STAKING_NOW_SECONDS }],
                }),
            })?.balances.withdrawable,
        ).toBe(`5${TRX}`);
    });

    it('lists the pending batches as unlocks in expiry order', () => {
        expect(
            getPosition({
                account: mockTronAccount({
                    unstakingBatches: [
                        { amount: `3${TRX}`, expireTime: MOCK_STAKING_NOW_SECONDS + 3600 * 48 },
                        { amount: `2${TRX}`, expireTime: MOCK_STAKING_NOW_SECONDS + 3600 * 24 },
                    ],
                }),
            })?.unlocks,
        ).toEqual([
            { amount: `2${TRX}`, availableAt: NOW_MS + DAY_MS },
            { amount: `3${TRX}`, availableAt: NOW_MS + 2 * DAY_MS },
        ]);
    });

    it('keeps the position of an account that only waits to withdraw', () => {
        expect(
            getPosition({
                account: mockTronAccount({
                    stakedBalance: '0',
                    stakedBalanceEnergy: '0',
                    totalVotingPower: '0',
                    votes: [],
                    unclaimedReward: '0',
                    unstakingBatches: [
                        { amount: `300${TRX}`, expireTime: MOCK_STAKING_NOW_SECONDS - 3600 },
                    ],
                }),
            }),
        ).toMatchObject({
            status: 'deactivating',
            balances: balances({ withdrawable: `300${TRX}` }),
            operations: ['stake', 'withdraw'],
        });
    });

    it('keeps the position of an account with rewards only', () => {
        expect(
            getPosition({
                account: mockTronAccount({
                    stakedBalance: '0',
                    stakedBalanceEnergy: '0',
                    totalVotingPower: '0',
                    votes: [],
                }),
            }),
        ).toMatchObject({
            status: 'inactive',
            balances: balances({ rewards: '1500000' }),
            operations: ['stake', 'claim'],
        });
    });

    it('derives no position from empty staking info', () => {
        expect(
            getPosition({
                account: mockTronAccount({
                    stakedBalance: '0',
                    stakedBalanceEnergy: '0',
                    totalVotingPower: '0',
                    votes: [],
                    unclaimedReward: '0',
                }),
            }),
        ).toBeNull();
    });

    it('withholds the claim until the cooldown is over', () => {
        expect(getScenarioPosition('rewardsOnCooldown')).toMatchObject({
            balances: balances({ staked: `1000${TRX}`, rewards: `2${TRX}` }),
            operations: ['stake', 'unstake', 'vote'],
            details: { rewardClaimAvailableAt: NOW_MS + 23 * 60 * 60 * 1000 },
        });
        expect(
            getPosition({
                account: mockTronAccount({ latestWithdrawTime: MOCK_STAKING_NOW_SECONDS - 86400 }),
            })?.operations,
        ).toContain('claim');
    });

    describe('revalidateAt', () => {
        const HOUR_MS = 60 * 60 * 1000;

        it('is a second after the next unlock', () => {
            expect(getScenarioPosition('unstakingWithdrawable')?.revalidateAt).toBe(
                NOW_MS + 7 * DAY_MS + 1000,
            );
        });

        it('is a second after the claim cooldown ends', () => {
            expect(getScenarioPosition('rewardsOnCooldown')?.revalidateAt).toBe(
                NOW_MS + 23 * HOUR_MS + 1000,
            );
        });

        it('takes the earlier of an unlock and the claim cooldown', () => {
            expect(
                getPosition({
                    account: mockTronAccount({
                        latestWithdrawTime: MOCK_STAKING_NOW_SECONDS - 3600,
                        unstakingBatches: [
                            { amount: `2${TRX}`, expireTime: MOCK_STAKING_NOW_SECONDS + 3600 },
                        ],
                    }),
                })?.revalidateAt,
            ).toBe(NOW_MS + HOUR_MS + 1000);
        });

        it('ignores the cooldown without rewards to claim', () => {
            expect(
                getPosition({
                    account: mockTronAccount({
                        latestWithdrawTime: MOCK_STAKING_NOW_SECONDS - 3600,
                        unclaimedReward: '0',
                    }),
                })?.revalidateAt,
            ).toBeNull();
        });
    });

    it('counts delegated TRX as staked and carries the delegated resources', () => {
        expect(
            getPosition({
                account: mockTronAccount({
                    stakedBalance: `700${TRX}`,
                    stakedBalanceEnergy: `600${TRX}`,
                    stakedBalanceBandwidth: `100${TRX}`,
                    delegatedBalanceEnergy: `400${TRX}`,
                    totalVotingPower: '1100',
                    availableVotingPower: '100',
                }),
            }),
        ).toMatchObject({
            balances: balances({ staked: `1100${TRX}`, rewards: '1500000' }),
            operations: ['stake', 'unstake', 'claim', 'vote'],
            details: {
                frozen: { energy: `600${TRX}`, bandwidth: `100${TRX}` },
                delegated: { energy: `400${TRX}`, bandwidth: '0' },
                votingPower: `1100${TRX}`,
            },
        });
    });

    it('keeps the votes of an account that delegated all its TRX, without unstake', () => {
        expect(
            getPosition({
                account: mockTronAccount({
                    stakedBalance: '0',
                    stakedBalanceEnergy: '0',
                    delegatedBalanceEnergy: `1000${TRX}`,
                }),
            }),
        ).toMatchObject({
            status: 'active',
            balances: balances({ staked: `1000${TRX}`, rewards: '1500000' }),
            targets: [{ address: MOCK_TRON_LUGANODES_SR, amount: `1000${TRX}` }],
            operations: ['stake', 'claim', 'vote'],
        });
    });

    it('lists the pending Tron staking transactions', () => {
        const pendingFreeze = mockStakingTransaction({
            txid: 'pending-freeze',
            blockHeight: undefined,
            tronSpecific: { contractType: 'FreezeBalanceV2Contract' },
        });
        const pendingTransfer = mockStakingTransaction({
            txid: 'pending-transfer',
            blockHeight: undefined,
            tronSpecific: { contractType: 'TransferContract' },
        });
        const confirmedVote = mockStakingTransaction({
            txid: 'confirmed-vote',
            tronSpecific: { contractType: 'VoteWitnessContract' },
        });

        expect(
            getPosition({
                account: mockTronStakingAccount('votedLuganodes'),
                transactions: [pendingFreeze, pendingTransfer, confirmedVote],
            })?.pendingTransactions,
        ).toEqual([{ txid: 'pending-freeze', operation: 'stake' }]);
    });

    it.each([
        { contractType: 'FreezeBalanceContract', operation: 'stake' },
        { contractType: 'FreezeBalanceV2Contract', operation: 'stake' },
        { contractType: 'UnfreezeBalanceContract', operation: 'unstake' },
        { contractType: 'UnfreezeBalanceV2Contract', operation: 'unstake' },
        { contractType: 'VoteWitnessContract', operation: 'vote' },
        { contractType: 'WithdrawExpireUnfreezeContract', operation: 'withdraw' },
        { contractType: 'WithdrawBalanceContract', operation: 'claim' },
    ])('labels a pending $contractType as $operation', ({ contractType, operation }) => {
        expect(
            getPosition({
                account: mockTronStakingAccount('votedLuganodes'),
                transactions: [
                    mockStakingTransaction({
                        txid: `pending-${contractType}`,
                        blockHeight: undefined,
                        tronSpecific: { contractType },
                    }),
                ],
            })?.pendingTransactions,
        ).toEqual([{ txid: `pending-${contractType}`, operation }]);
    });
});
