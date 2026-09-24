import {
    type ChainRewardsWithFiat,
    type MerklRewardsParams,
} from '@suite-common/earn-stablecoin-api';
import { weakMapMemoize } from '@suite-common/redux-utils';
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

const createStableBaseCurrencyAmount = weakMapMemoize((value: string) =>
    asBaseCurrencyAmount(new BigNumber(value)),
);

const getChainAddressKey = ({ chainId, address }: MerklRewardsParams<string>) =>
    `${chainId}:${address.toLowerCase()}`;

const getAccountChainAddressKey = (account: Account) => {
    if (account.networkType !== 'ethereum') {
        return null;
    }

    const network = getNetwork(account.symbol);

    if (!network?.chainId) {
        return null;
    }

    return getChainAddressKey({
        chainId: network.chainId,
        address: account.descriptor,
    });
};

const getChainsRewardsByAccountKey = (chainsRewardsWithFiat: ChainRewardsWithFiat[]) =>
    new Map(
        chainsRewardsWithFiat.map(chainRewards => [
            getChainAddressKey({
                chainId: chainRewards.chainId,
                address: chainRewards.address,
            }),
            chainRewards,
        ]),
    );

const getTotalFiatAmountFromClaimableRewards = (
    claimableRewards: ChainRewardsWithFiat['rewards'],
) => {
    const fiatClaimableAmounts = claimableRewards.flatMap(reward =>
        reward.fiat.claimable === null ? [] : [reward.fiat.claimable],
    );

    if (fiatClaimableAmounts.length !== claimableRewards.length) {
        return null;
    }

    return createStableBaseCurrencyAmount(
        fiatClaimableAmounts
            .reduce((total, fiatClaimable) => total.plus(fiatClaimable), new BigNumber(0))
            .toFixed(),
    );
};

const getStablecoinYieldAccountRewardsFromMap = (
    account: Account,
    chainsRewardsByAccountKey: Map<string, ChainRewardsWithFiat>,
): StablecoinYieldAccountRewards | null => {
    const accountChainAddressKey = getAccountChainAddressKey(account);

    if (accountChainAddressKey === null) {
        return null;
    }

    const chainRewards = chainsRewardsByAccountKey.get(accountChainAddressKey);

    if (!chainRewards) {
        return null;
    }

    const claimableRewards = chainRewards.rewards.filter(reward =>
        new BigNumber(reward.claimable).gt(0),
    );

    if (claimableRewards.length === 0) {
        return null;
    }

    return {
        account,
        rewards: claimableRewards,
        totalFiatClaimableAmount: getTotalFiatAmountFromClaimableRewards(claimableRewards),
    };
};

export const getStablecoinYieldAccountRewards = ({
    account,
    chainsRewardsWithFiat,
}: {
    account: Account;
    chainsRewardsWithFiat: ChainRewardsWithFiat[];
}): StablecoinYieldAccountRewards | null =>
    getStablecoinYieldAccountRewardsFromMap(
        account,
        getChainsRewardsByAccountKey(chainsRewardsWithFiat),
    );
