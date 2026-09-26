import { type ChainRewardsWithFiat } from '@suite-common/earn-stablecoin-api';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type Account,
    asAccountDescriptor,
    asBaseCurrencyAmount,
} from '@suite-common/wallet-types';
import { mockWalletAccount, networkSpecificDefaultCardano } from '@suite-common/wallet-types/mocks';
import { BigNumber } from '@trezor/utils';

import { getStablecoinYieldAccountRewards } from './stablecoinYieldClaimSummaryUtils';

const ethereumAccount = mockWalletAccount({
    symbol: asNetworkSymbol('eth'),
    descriptor: asAccountDescriptor('0xff6845f200000000000000000000000013fb4863'),
});

const anotherEthereumAccount = mockWalletAccount({
    symbol: asNetworkSymbol('eth'),
    descriptor: asAccountDescriptor('0xaa6845f200000000000000000000000013fb4863'),
});

const cardanoAccount = mockWalletAccount(
    {
        symbol: asNetworkSymbol('ada'),
        descriptor: asAccountDescriptor('addr1cardano'),
    },
    networkSpecificDefaultCardano,
);

const createReward = ({
    claimable,
    fiatClaimable,
}: {
    claimable: string;
    fiatClaimable: string | null;
}): ChainRewardsWithFiat['rewards'][number] => ({
    root: '0xroot',
    amount: claimable,
    claimed: '0',
    pending: '0',
    token: {
        address: '0x0000000000000000000000000000000000000001',
        chainId: 1,
        symbol: 'USDC',
        decimals: 6,
    },
    proofs: [],
    claimable: asBaseCurrencyAmount(new BigNumber(claimable)),
    fiat: {
        amount: null,
        claimed: null,
        pending: null,
        claimable:
            fiatClaimable === null ? null : asBaseCurrencyAmount(new BigNumber(fiatClaimable)),
    },
});

const createChainRewards = ({
    account,
    rewards,
    address = account.descriptor,
}: {
    account: Account;
    rewards: ChainRewardsWithFiat['rewards'];
    address?: string;
}): ChainRewardsWithFiat => ({
    chainId: 1,
    address,
    totalClaimable: rewards
        .reduce((total, reward) => total.plus(reward.claimable), new BigNumber(0))
        .toFixed(),
    rewards,
});

describe('getStablecoinYieldAccountRewards', () => {
    it('returns the claimable rewards of the account with their fiat total', () => {
        const rewards = [
            createReward({ claimable: '1000000', fiatClaimable: '1.25' }),
            createReward({ claimable: '2000000', fiatClaimable: '2.5' }),
        ];

        const accountRewards = getStablecoinYieldAccountRewards({
            account: ethereumAccount,
            chainsRewardsWithFiat: [
                createChainRewards({ account: ethereumAccount, rewards }),
                createChainRewards({
                    account: anotherEthereumAccount,
                    rewards: [createReward({ claimable: '5000000', fiatClaimable: '5' })],
                }),
            ],
        });

        expect(accountRewards?.account).toBe(ethereumAccount);
        expect(accountRewards?.rewards).toEqual(rewards);
        expect(accountRewards?.totalFiatClaimableAmount?.toString()).toBe('3.75');
    });

    it('ignores rewards with a zero claimable amount', () => {
        const claimableReward = createReward({ claimable: '1000000', fiatClaimable: '1.25' });

        const accountRewards = getStablecoinYieldAccountRewards({
            account: ethereumAccount,
            chainsRewardsWithFiat: [
                createChainRewards({
                    account: ethereumAccount,
                    rewards: [
                        createReward({ claimable: '0', fiatClaimable: '0' }),
                        claimableReward,
                    ],
                }),
            ],
        });

        expect(accountRewards?.rewards).toEqual([claimableReward]);
        expect(accountRewards?.totalFiatClaimableAmount?.toString()).toBe('1.25');
    });

    it('returns null when the account has no claimable rewards', () => {
        expect(
            getStablecoinYieldAccountRewards({
                account: ethereumAccount,
                chainsRewardsWithFiat: [
                    createChainRewards({
                        account: ethereumAccount,
                        rewards: [createReward({ claimable: '0', fiatClaimable: '0' })],
                    }),
                ],
            }),
        ).toBeNull();
    });

    it('returns null when there are no rewards for the account address', () => {
        expect(
            getStablecoinYieldAccountRewards({
                account: ethereumAccount,
                chainsRewardsWithFiat: [
                    createChainRewards({
                        account: anotherEthereumAccount,
                        rewards: [createReward({ claimable: '1000000', fiatClaimable: '1.25' })],
                    }),
                ],
            }),
        ).toBeNull();
    });

    it('returns null for accounts outside ethereum networks', () => {
        expect(
            getStablecoinYieldAccountRewards({
                account: cardanoAccount,
                chainsRewardsWithFiat: [
                    createChainRewards({
                        account: cardanoAccount,
                        rewards: [createReward({ claimable: '1000000', fiatClaimable: '1.25' })],
                    }),
                ],
            }),
        ).toBeNull();
    });

    it('matches the rewards address regardless of its casing', () => {
        const accountRewards = getStablecoinYieldAccountRewards({
            account: ethereumAccount,
            chainsRewardsWithFiat: [
                createChainRewards({
                    account: ethereumAccount,
                    address: ethereumAccount.descriptor.toUpperCase(),
                    rewards: [createReward({ claimable: '1000000', fiatClaimable: '1.25' })],
                }),
            ],
        });

        expect(accountRewards?.rewards).toHaveLength(1);
    });

    it('returns a null fiat total when any claimable reward lacks a fiat value', () => {
        const accountRewards = getStablecoinYieldAccountRewards({
            account: ethereumAccount,
            chainsRewardsWithFiat: [
                createChainRewards({
                    account: ethereumAccount,
                    rewards: [
                        createReward({ claimable: '1000000', fiatClaimable: '1.25' }),
                        createReward({ claimable: '2000000', fiatClaimable: null }),
                    ],
                }),
            ],
        });

        expect(accountRewards?.rewards).toHaveLength(2);
        expect(accountRewards?.totalFiatClaimableAmount).toBeNull();
    });

    it('keeps the fiat total reference across recreated inputs', () => {
        const getTotal = () =>
            getStablecoinYieldAccountRewards({
                account: { ...ethereumAccount },
                chainsRewardsWithFiat: [
                    createChainRewards({
                        account: ethereumAccount,
                        rewards: [createReward({ claimable: '1000000', fiatClaimable: '1.25' })],
                    }),
                ],
            })?.totalFiatClaimableAmount;

        expect(getTotal()).toBe(getTotal());
    });
});
