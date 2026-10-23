import { LUGANODES_TRON_SRS, P2P_ORG_TRON_SRS, asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type TronStakingInfo } from '@trezor/blockchain-link-types';
import { BigNumber } from '@trezor/utils';

import { deriveTronStakingPositions } from './tronStakingPositions';

const trxSymbol = asNetworkSymbol('trx');
const [luganodesSr = ''] = LUGANODES_TRON_SRS;
const [p2pOrgSr = ''] = P2P_ORG_TRON_SRS;
const OTHER_SR = 'TOtherSuperRepresentative';

const buildStakingInfo = (overrides: Partial<TronStakingInfo> = {}): TronStakingInfo => ({
    stakedBalance: '0',
    stakedBalanceEnergy: '0',
    stakedBalanceBandwidth: '0',
    unstakingBatches: [],
    totalVotingPower: '0',
    availableVotingPower: '0',
    votes: [],
    unclaimedReward: '0',
    latestWithdrawTime: 0,
    delegatedBalanceEnergy: '0',
    delegatedBalanceBandwidth: '0',
    ...overrides,
});

const tronAccount = (stakingInfo?: TronStakingInfo): Account =>
    ({
        ...mockWalletAccount({ symbol: trxSymbol }),
        networkType: 'tron',
        misc: {
            tronResources: {
                availableStakedBandwidth: 0,
                totalStakedBandwidth: 0,
                availableFreeBandwidth: 0,
                totalFreeBandwidth: 0,
                availableEnergy: 0,
                totalEnergy: 0,
                totalEnergyLimit: 0,
                totalEnergyWeight: 0,
                totalBandwidthLimit: 0,
                totalBandwidthWeight: 0,
                stakingInfo,
            },
        },
    }) as unknown as Account;

const sum = (amounts: string[]) =>
    amounts.reduce((total, amount) => total.plus(amount), new BigNumber(0)).toFixed();

describe(deriveTronStakingPositions.name, () => {
    it('holds all the stake with the product the account votes for', () => {
        const account = tronAccount(
            buildStakingInfo({
                stakedBalance: '100000000',
                votes: [{ address: luganodesSr, voteCount: '100' }],
            }),
        );

        expect(deriveTronStakingPositions(account)).toEqual([
            {
                accountKey: account.key,
                productId: 'trx:trx:luganodes:native',
                providerId: 'luganodes',
                symbol: trxSymbol,
                asset: 'trx',
                kind: 'native',
                staked: '100',
                withdrawable: '100',
                pendingStake: '0',
                activating: '0',
                unstaking: '0',
                claimable: '0',
                rewards: null,
                claimableRewards: '0',
                canClaim: false,
                total: '100',
                contributesToNativeBalance: true,
                details: {
                    type: 'tron-votes',
                    votes: [{ address: luganodesSr, voteCount: '100' }],
                },
            },
        ]);
    });

    it('splits the stake by votes and keeps the rest unattributed', () => {
        const unstakingBatches = [
            { amount: '3000000', expireTime: 1 },
            { amount: '5000000', expireTime: 2 },
        ];
        const account = tronAccount(
            buildStakingInfo({
                stakedBalance: '100000000',
                votes: [
                    { address: luganodesSr, voteCount: '60' },
                    { address: p2pOrgSr, voteCount: '30' },
                    { address: OTHER_SR, voteCount: '5' },
                ],
                unstakingBatches,
                unclaimedReward: '2000000',
            }),
        );

        const positions = deriveTronStakingPositions(account);

        expect(positions).toEqual([
            expect.objectContaining({ productId: 'trx:trx:luganodes:native', staked: '60' }),
            expect.objectContaining({ productId: 'trx:trx:p2p.org:native', staked: '30' }),
            expect.objectContaining({
                productId: null,
                providerId: null,
                staked: '10',
                unstaking: '8',
                rewards: '2',
                claimableRewards: '2',
                total: '18',
                details: {
                    type: 'tron-unattributed',
                    votes: [{ address: OTHER_SR, voteCount: '5' }],
                    unstakingBatches,
                },
            }),
        ]);
        expect(sum(positions.map(position => position.staked))).toBe('100');
        expect(sum(positions.map(position => position.unstaking))).toBe('8');
    });

    it('keeps stake without votes unattributed', () => {
        const positions = deriveTronStakingPositions(
            tronAccount(buildStakingInfo({ stakedBalance: '25500000' })),
        );

        expect(positions).toEqual([
            expect.objectContaining({ productId: null, staked: '25.5', total: '25.5' }),
        ]);
    });

    it('keeps unfreeze batches and rewards after all the stake is unfrozen', () => {
        const positions = deriveTronStakingPositions(
            tronAccount(
                buildStakingInfo({
                    unstakingBatches: [{ amount: '7000000', expireTime: 1 }],
                    unclaimedReward: '1500000',
                }),
            ),
        );

        expect(positions).toEqual([
            expect.objectContaining({
                productId: null,
                staked: '0',
                unstaking: '7',
                rewards: '1.5',
                total: '7',
            }),
        ]);
    });

    it('never makes the unattributed stake negative when votes exceed the stake', () => {
        const positions = deriveTronStakingPositions(
            tronAccount(
                buildStakingInfo({
                    stakedBalance: '10000000',
                    votes: [{ address: p2pOrgSr, voteCount: '12' }],
                }),
            ),
        );

        expect(positions).toEqual([
            expect.objectContaining({ productId: 'trx:trx:p2p.org:native', staked: '12' }),
        ]);
    });

    it('derives nothing without staking info or for other networks', () => {
        expect(deriveTronStakingPositions(tronAccount())).toEqual([]);
        expect(deriveTronStakingPositions(tronAccount(buildStakingInfo()))).toEqual([]);
        expect(
            deriveTronStakingPositions(mockWalletAccount({ symbol: asNetworkSymbol('eth') })),
        ).toEqual([]);
    });
});
