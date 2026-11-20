import { type Account, asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

import { type ChainRewardsWithFiat } from './useExtendMerklRewardsWithFiat';
import { pairRewardsWithAccounts } from './usePairRewardsWithAccounts';

const ADDRESS = '0x00000000000000000000000000000000000000aa';

const account = {
    networkType: 'ethereum',
    symbol: 'eth',
    descriptor: ADDRESS,
} as Account;

const reward = (claimable: string, fiatClaimable: string | null) => ({
    claimable: asBaseCurrencyAmount(new BigNumber(claimable)),
    fiat: {
        claimable:
            fiatClaimable === null ? null : asBaseCurrencyAmount(new BigNumber(fiatClaimable)),
    },
});

const chainRewards = (rewards: ReturnType<typeof reward>[]) =>
    [{ chainId: 1, address: ADDRESS, rewards }] as unknown as ChainRewardsWithFiat[];

describe('pairRewardsWithAccounts', () => {
    it('sums the fiat value of claimable rewards', () => {
        expect(
            pairRewardsWithAccounts({
                accounts: [account],
                chainsRewardsWithFiat: chainRewards([reward('100', '1.5'), reward('200', '2')]),
            }),
        ).toEqual([
            expect.objectContaining({
                totalClaimableFiatAmount: new BigNumber('3.5'),
                isTotalClaimableFiatAmountComplete: true,
            }),
        ]);
    });

    it('keeps an account whose claimable rewards have no fiat rate', () => {
        expect(
            pairRewardsWithAccounts({
                accounts: [account],
                chainsRewardsWithFiat: chainRewards([reward('100', null)]),
            }),
        ).toEqual([
            expect.objectContaining({ account, isTotalClaimableFiatAmountComplete: false }),
        ]);
    });

    it('ignores the missing fiat rate of a reward with nothing to claim', () => {
        expect(
            pairRewardsWithAccounts({
                accounts: [account],
                chainsRewardsWithFiat: chainRewards([reward('100', '1.5'), reward('0', null)]),
            }),
        ).toEqual([expect.objectContaining({ isTotalClaimableFiatAmountComplete: true })]);
    });

    it('drops an account with nothing to claim', () => {
        expect(
            pairRewardsWithAccounts({
                accounts: [account],
                chainsRewardsWithFiat: chainRewards([reward('0', '0')]),
            }),
        ).toEqual([]);
    });
});
