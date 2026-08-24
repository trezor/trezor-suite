import { renderHook } from '@testing-library/react';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountWithNetworkType,
    asAccountDescriptor,
    asBaseCurrencyAmount,
} from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { BigNumber } from '@trezor/utils';

import { useYieldClaimRewardsData } from './useYieldClaimRewardsData';

type RewardsQuery = Parameters<typeof useYieldClaimRewardsData>[0]['rewards'];
type AccountsRewards = RewardsQuery['data']['accountsRewards'];
type AccountRewards = AccountsRewards[number];
type Reward = AccountRewards['rewards'][number];
type RewardToken = Reward['token'];

const USDC: RewardToken = {
    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    chainId: 1,
    symbol: 'USDC',
    decimals: 6,
};

const WETH: RewardToken = {
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    chainId: 1,
    symbol: 'WETH',
    decimals: 18,
};

interface CreateRewardProps {
    token: RewardToken;
    claimable: string;
    fiatClaimable: string | null;
}

const createReward = ({ token, claimable, fiatClaimable }: CreateRewardProps): Reward => ({
    root: '0x2e7100',
    amount: claimable,
    claimed: '0',
    pending: '0',
    proofs: [],
    token,
    claimable: asBaseCurrencyAmount(new BigNumber(claimable)),
    fiat: {
        amount: null,
        claimed: null,
        pending: null,
        claimable:
            fiatClaimable === null ? null : asBaseCurrencyAmount(new BigNumber(fiatClaimable)),
    },
});

const createAccount = (descriptor: string) =>
    mockWalletAccount({
        symbol: asNetworkSymbol('eth'),
        descriptor: asAccountDescriptor(descriptor),
    }) as AccountWithNetworkType<'ethereum'>;

const createAccountRewards = (
    account: AccountWithNetworkType<'ethereum'>,
    rewards: Reward[],
): AccountRewards => ({
    account,
    rewards,
    totalClaimableFiatAmount: asBaseCurrencyAmount(
        rewards.reduce(
            (total, reward) => total.plus(reward.fiat.claimable ?? '0'),
            new BigNumber(0),
        ),
    ),
});

const createRewardsQuery = (accountsRewards: AccountsRewards) =>
    ({ data: { accountsRewards } }) as unknown as RewardsQuery;

const renderUseYieldClaimRewardsData = (accountsRewards: AccountsRewards) => {
    const { result } = renderHook(() =>
        useYieldClaimRewardsData({ rewards: createRewardsQuery(accountsRewards) }),
    );

    return {
        accountRewards: result.current.accountRewards.map(({ account, fiat }) => ({
            accountKey: account.key,
            fiat: fiat.toString(),
        })),
        tokenRewards: result.current.tokenRewards.map(
            ({ symbol, networkSymbol, contractAddress, crypto, fiat }) => ({
                symbol,
                networkSymbol,
                contractAddress,
                crypto: crypto.toString(),
                fiat: fiat.toString(),
            }),
        ),
    };
};

describe(useYieldClaimRewardsData.name, () => {
    it('returns nothing when no account has rewards', () => {
        const { accountRewards, tokenRewards } = renderUseYieldClaimRewardsData([]);

        expect(accountRewards).toEqual([]);
        expect(tokenRewards).toEqual([]);
    });

    it('converts a single reward of a single account to units', () => {
        const account = createAccount('0xaccounta');

        const { accountRewards, tokenRewards } = renderUseYieldClaimRewardsData([
            createAccountRewards(account, [
                createReward({ token: USDC, claimable: '12500000', fiatClaimable: '12.5' }),
            ]),
        ]);

        expect(accountRewards).toEqual([{ accountKey: account.key, fiat: '12.5' }]);
        expect(tokenRewards).toEqual([
            {
                symbol: 'USDC',
                networkSymbol: 'eth',
                contractAddress: USDC.address,
                crypto: '12.5',
                fiat: '12.5',
            },
        ]);
    });

    it('sums rewards of the same token of a single account and keeps other tokens separate', () => {
        const account = createAccount('0xaccounta');

        const { accountRewards, tokenRewards } = renderUseYieldClaimRewardsData([
            createAccountRewards(account, [
                createReward({ token: USDC, claimable: '10000000', fiatClaimable: '10' }),
                createReward({ token: USDC, claimable: '2500000', fiatClaimable: '2.5' }),
                createReward({
                    token: WETH,
                    claimable: '500000000000000000',
                    fiatClaimable: '1500',
                }),
            ]),
        ]);

        expect(accountRewards).toEqual([{ accountKey: account.key, fiat: '1512.5' }]);
        expect(tokenRewards).toEqual([
            {
                symbol: 'USDC',
                networkSymbol: 'eth',
                contractAddress: USDC.address,
                crypto: '12.5',
                fiat: '12.5',
            },
            {
                symbol: 'WETH',
                networkSymbol: 'eth',
                contractAddress: WETH.address,
                crypto: '0.5',
                fiat: '1500',
            },
        ]);
    });

    it('counts a reward without a fiat rate as zero fiat while keeping its crypto amount', () => {
        const account = createAccount('0xaccounta');

        const { accountRewards, tokenRewards } = renderUseYieldClaimRewardsData([
            createAccountRewards(account, [
                createReward({ token: USDC, claimable: '10000000', fiatClaimable: '10' }),
                createReward({ token: USDC, claimable: '2500000', fiatClaimable: null }),
            ]),
        ]);

        expect(accountRewards).toEqual([{ accountKey: account.key, fiat: '10' }]);
        expect(tokenRewards).toEqual([
            {
                symbol: 'USDC',
                networkSymbol: 'eth',
                contractAddress: USDC.address,
                crypto: '12.5',
                fiat: '10',
            },
        ]);
    });

    it('sums rewards per token across accounts and keeps the fiat total per account', () => {
        const firstAccount = createAccount('0xaccounta');
        const secondAccount = createAccount('0xaccountb');

        const { accountRewards, tokenRewards } = renderUseYieldClaimRewardsData([
            createAccountRewards(firstAccount, [
                createReward({ token: USDC, claimable: '10000000', fiatClaimable: '10' }),
                createReward({
                    token: WETH,
                    claimable: '500000000000000000',
                    fiatClaimable: '1500',
                }),
            ]),
            createAccountRewards(secondAccount, [
                createReward({ token: USDC, claimable: '5000000', fiatClaimable: '5' }),
                createReward({
                    token: WETH,
                    claimable: '250000000000000000',
                    fiatClaimable: '750',
                }),
            ]),
        ]);

        expect(accountRewards).toEqual([
            { accountKey: firstAccount.key, fiat: '1510' },
            { accountKey: secondAccount.key, fiat: '755' },
        ]);
        expect(tokenRewards).toEqual([
            {
                symbol: 'USDC',
                networkSymbol: 'eth',
                contractAddress: USDC.address,
                crypto: '15',
                fiat: '15',
            },
            {
                symbol: 'WETH',
                networkSymbol: 'eth',
                contractAddress: WETH.address,
                crypto: '0.75',
                fiat: '2250',
            },
        ]);
    });
});
