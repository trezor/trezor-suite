import { type ChainRewardsWithFiat } from '@suite-common/earn-stablecoin-api';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type Account,
    asAccountDescriptor,
    asBaseCurrencyAmount,
    toTokenAddress,
} from '@suite-common/wallet-types';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { BigNumber } from '@trezor/utils';

import {
    buildStablecoinYieldClaimSummaries,
    getStablecoinYieldAccountRewards,
    getStablecoinYieldClaimRewardsSnapshot,
    getTotalFiatClaimableAmount,
} from './stablecoinYieldClaimSummaryUtils';

const ethSymbol = asNetworkSymbol('eth');

const receiptTokenContract = toTokenAddress('0x0000000000000000000000000000000000000002');

const ethereumAccount = mockWalletAccount({
    symbol: ethSymbol,
    descriptor: asAccountDescriptor('0xff6845f200000000000000000000000013fb4863'),
    accountLabel: 'Ethereum #1',
    tokens: [
        mockAccountToken({
            contract: receiptTokenContract,
            balance: '42',
            decimals: 6,
            symbol: 'USDC',
        }),
    ],
});

const anotherEthereumAccount = mockWalletAccount({
    symbol: ethSymbol,
    descriptor: asAccountDescriptor('0xaa6845f200000000000000000000000013fb4863'),
    accountLabel: 'Ethereum #2',
    tokens: [
        mockAccountToken({
            contract: receiptTokenContract,
            balance: '0',
            decimals: 6,
            symbol: 'USDC',
        }),
    ],
});

const exitedEthereumAccount = mockWalletAccount({
    symbol: ethSymbol,
    descriptor: asAccountDescriptor('0xbb6845f200000000000000000000000013fb4863'),
    accountLabel: 'Ethereum #3',
    tokens: [],
});

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
}: {
    account: Account;
    rewards: ChainRewardsWithFiat['rewards'];
}): ChainRewardsWithFiat => ({
    chainId: 1,
    address: account.descriptor,
    totalClaimable: rewards
        .reduce((total, reward) => total.plus(reward.claimable), new BigNumber(0))
        .toFixed(),
    rewards,
});

describe('stablecoinYieldClaimSummaryUtils', () => {
    it('keeps claimable summaries when fiat values are missing and ignores zero raw claimables', () => {
        const summaries = buildStablecoinYieldClaimSummaries({
            accounts: [ethereumAccount, anotherEthereumAccount],
            chainsRewardsWithFiat: [
                createChainRewards({
                    account: ethereumAccount,
                    rewards: [createReward({ claimable: '1000000', fiatClaimable: null })],
                }),
                createChainRewards({
                    account: anotherEthereumAccount,
                    rewards: [createReward({ claimable: '0', fiatClaimable: '0' })],
                }),
            ],
        });

        expect(summaries).toEqual([
            {
                type: 'stablecoin-yield',
                accountKey: ethereumAccount.key,
                accountLabel: ethereumAccount.accountLabel,
                accountDescriptor: ethereumAccount.descriptor,
                networkSymbol: ethereumAccount.symbol,
                claimableRewardsCount: 1,
                fiatClaimableAmount: null,
            },
        ]);
        expect(getTotalFiatClaimableAmount(summaries)).toBeNull();
    });

    it('builds summaries for accounts without any receipt-token balance (fully exited vaults)', () => {
        const summaries = buildStablecoinYieldClaimSummaries({
            accounts: [anotherEthereumAccount, exitedEthereumAccount],
            chainsRewardsWithFiat: [
                createChainRewards({
                    account: anotherEthereumAccount,
                    rewards: [createReward({ claimable: '1000000', fiatClaimable: '1.25' })],
                }),
                createChainRewards({
                    account: exitedEthereumAccount,
                    rewards: [createReward({ claimable: '2000000', fiatClaimable: '2.5' })],
                }),
            ],
        });

        expect(summaries).toEqual([
            expect.objectContaining({
                accountKey: anotherEthereumAccount.key,
                claimableRewardsCount: 1,
            }),
            expect.objectContaining({
                accountKey: exitedEthereumAccount.key,
                claimableRewardsCount: 1,
            }),
        ]);
        expect(getTotalFiatClaimableAmount(summaries)?.toString()).toBe('3.75');
    });

    it('sums fiat values only when all claimable rewards have fiat values', () => {
        const chainsRewardsWithFiat = [
            createChainRewards({
                account: ethereumAccount,
                rewards: [
                    createReward({ claimable: '1000000', fiatClaimable: '1.25' }),
                    createReward({ claimable: '2000000', fiatClaimable: '2.5' }),
                ],
            }),
        ];
        const summaries = buildStablecoinYieldClaimSummaries({
            accounts: [ethereumAccount],
            chainsRewardsWithFiat,
        });
        const accountRewards = getStablecoinYieldAccountRewards({
            account: ethereumAccount,
            chainsRewardsWithFiat,
        });

        expect(summaries[0]?.claimableRewardsCount).toBe(2);
        expect(summaries[0]?.fiatClaimableAmount?.toString()).toBe('3.75');
        expect(accountRewards?.totalFiatClaimableAmount?.toString()).toBe('3.75');
        expect(accountRewards?.rewards).toHaveLength(2);
        expect(getTotalFiatClaimableAmount(summaries)?.toString()).toBe('3.75');
    });

    it('builds stable claim reward snapshots with token and fiat values', () => {
        const accountRewards = getStablecoinYieldAccountRewards({
            account: ethereumAccount,
            chainsRewardsWithFiat: [
                createChainRewards({
                    account: ethereumAccount,
                    rewards: [createReward({ claimable: '1000000', fiatClaimable: '1.25' })],
                }),
            ],
        });

        if (!accountRewards) {
            throw new Error('Expected claimable account rewards.');
        }

        expect(getStablecoinYieldClaimRewardsSnapshot(accountRewards)).toEqual([
            {
                token: {
                    networkSymbol: 'eth',
                    symbol: 'USDC',
                    decimals: 6,
                    contractAddress: '0x0000000000000000000000000000000000000001',
                },
                value: '1',
                fiatValue: '1.25',
            },
        ]);
    });
});
