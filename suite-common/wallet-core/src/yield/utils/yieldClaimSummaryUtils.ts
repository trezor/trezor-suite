import {
    type ChainRewardsWithFiat,
    type MerklRewardsParams,
} from '@suite-common/earn-stablecoin-api';
import { getNetwork } from '@suite-common/wallet-config';
import {
    type Account,
    type BaseCurrencyAmount,
    asBaseCurrencyAmount,
} from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

export type StablecoinYieldAccountRewards = {
    account: Account;
    rewards: ChainRewardsWithFiat['rewards'];
    totalFiatClaimableAmount: BaseCurrencyAmount | null;
};

export const getChainAddressKey = ({ chainId, address }: MerklRewardsParams<string>) =>
    `${chainId}:${address.toLowerCase()}`;

export const getAccountChainAddressKey = (account: Account): string | null => {
    if (account.networkType !== 'ethereum') return null;

    const network = getNetwork(account.symbol);

    if (!network?.chainId) return null;

    return getChainAddressKey({ chainId: network.chainId, address: account.descriptor });
};

export const getChainsRewardsByAccountKey = (
    chainsRewardsWithFiat: readonly ChainRewardsWithFiat[],
) =>
    new Map(
        chainsRewardsWithFiat.map(chainRewards => [
            getChainAddressKey({ chainId: chainRewards.chainId, address: chainRewards.address }),
            chainRewards,
        ]),
    );

export const getAccountChainRewards = (
    account: Account,
    chainsRewardsByAccountKey: Map<string, ChainRewardsWithFiat>,
): ChainRewardsWithFiat | null => {
    const accountChainAddressKey = getAccountChainAddressKey(account);

    if (accountChainAddressKey === null) return null;

    return chainsRewardsByAccountKey.get(accountChainAddressKey) ?? null;
};

export const getClaimableRewards = (
    chainRewards: ChainRewardsWithFiat,
): ChainRewardsWithFiat['rewards'] =>
    chainRewards.rewards.filter(reward => new BigNumber(reward.claimable).gt(0));

export const sumBaseCurrencyAmounts = (
    amounts: readonly BaseCurrencyAmount[],
): BaseCurrencyAmount =>
    asBaseCurrencyAmount(amounts.reduce((total, amount) => total.plus(amount), new BigNumber(0)));

export const getTotalFiatAmountFromClaimableRewards = (
    claimableRewards: ChainRewardsWithFiat['rewards'],
): BaseCurrencyAmount | null => {
    const fiatClaimableAmounts = claimableRewards.flatMap(reward =>
        reward.fiat.claimable === null ? [] : [reward.fiat.claimable],
    );

    if (fiatClaimableAmounts.length !== claimableRewards.length) return null;

    return sumBaseCurrencyAmounts(fiatClaimableAmounts);
};

export const getStablecoinYieldAccountRewardsFromMap = (
    account: Account,
    chainsRewardsByAccountKey: Map<string, ChainRewardsWithFiat>,
): StablecoinYieldAccountRewards | null => {
    const chainRewards = getAccountChainRewards(account, chainsRewardsByAccountKey);

    if (chainRewards === null) return null;

    const claimableRewards = getClaimableRewards(chainRewards);

    if (claimableRewards.length === 0) return null;

    return {
        account,
        rewards: claimableRewards,
        totalFiatClaimableAmount: getTotalFiatAmountFromClaimableRewards(claimableRewards),
    };
};

type GetStablecoinYieldAccountRewardsParams = {
    account: Account;
    chainsRewardsWithFiat: ChainRewardsWithFiat[];
};

export const getStablecoinYieldAccountRewards = ({
    account,
    chainsRewardsWithFiat,
}: GetStablecoinYieldAccountRewardsParams): StablecoinYieldAccountRewards | null =>
    getStablecoinYieldAccountRewardsFromMap(
        account,
        getChainsRewardsByAccountKey(chainsRewardsWithFiat),
    );
