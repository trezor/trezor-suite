import {
    type ChainRewardsWithFiat,
    type MerklRewardsParams,
} from '@suite-common/earn-stablecoin-api';
import { getNetwork } from '@suite-common/wallet-config';
import {
    type Account,
    type AccountKey,
    type BaseCurrencyAmount,
    asBaseCurrencyAmount,
} from '@suite-common/wallet-types';
import { type YieldClaimVaultParams } from '@suite-native/navigation';
import { BigNumber } from '@trezor/utils';

import {
    type EarnDepositsCardActiveItem,
    type StablecoinYieldClaimSummary,
    type StablecoinYieldPositionItem,
} from '../types';

type BuildStablecoinYieldClaimSummariesParams = {
    accounts: Account[];
    chainsRewardsWithFiat: ChainRewardsWithFiat[];
};

export type StablecoinYieldAccountRewards = {
    account: Account;
    rewards: ChainRewardsWithFiat['rewards'];
    totalFiatClaimableAmount: BaseCurrencyAmount | null;
};

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

    return asBaseCurrencyAmount(
        fiatClaimableAmounts.reduce(
            (total, fiatClaimable) => total.plus(fiatClaimable),
            new BigNumber(0),
        ),
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

export const buildStablecoinYieldClaimSummaries = ({
    accounts,
    chainsRewardsWithFiat,
}: BuildStablecoinYieldClaimSummariesParams): StablecoinYieldClaimSummary[] => {
    const chainsRewardsByAccountKey = getChainsRewardsByAccountKey(chainsRewardsWithFiat);

    return accounts.flatMap(account => {
        const accountRewards = getStablecoinYieldAccountRewardsFromMap(
            account,
            chainsRewardsByAccountKey,
        );

        if (!accountRewards) {
            return [];
        }

        return [
            {
                type: 'stablecoin-yield',
                accountKey: account.key,
                networkSymbol: account.symbol,
                claimableRewardsCount: accountRewards.rewards.length,
                fiatClaimableAmount: accountRewards.totalFiatClaimableAmount,
            },
        ];
    });
};

export type StablecoinYieldClaimItem = {
    summary: StablecoinYieldClaimSummary;
    positions: StablecoinYieldPositionItem[];
    vaults: YieldClaimVaultParams[];
};

const getAccountPositions = (
    earnDepositsActiveItems: EarnDepositsCardActiveItem[],
    accountKey: AccountKey,
): StablecoinYieldPositionItem[] =>
    earnDepositsActiveItems.flatMap(item =>
        item.type === 'stablecoin-yield' && item.accountKey === accountKey ? [item] : [],
    );

// Rewards are claimed per account, so one item covers all of the account's vault positions
// — and rewards outlive a fully withdrawn position, which leaves an item with no positions.
export const buildStablecoinYieldClaimItems = ({
    stablecoinYieldClaimSummaries,
    earnDepositsActiveItems,
}: {
    stablecoinYieldClaimSummaries: StablecoinYieldClaimSummary[];
    earnDepositsActiveItems: EarnDepositsCardActiveItem[];
}): StablecoinYieldClaimItem[] =>
    stablecoinYieldClaimSummaries.map(summary => {
        const positions = getAccountPositions(earnDepositsActiveItems, summary.accountKey);

        return {
            summary,
            positions,
            vaults: positions.flatMap(position =>
                position.title
                    ? [{ name: position.title, tokenContract: position.tokenContractAddress }]
                    : [],
            ),
        };
    });

export const getTotalFiatClaimableAmount = (
    stablecoinYieldClaimSummaries: StablecoinYieldClaimSummary[],
) => {
    if (stablecoinYieldClaimSummaries.length === 0) {
        return null;
    }

    const fiatClaimableAmounts = stablecoinYieldClaimSummaries.flatMap(claimSummary =>
        claimSummary.fiatClaimableAmount === null ? [] : [claimSummary.fiatClaimableAmount],
    );

    if (fiatClaimableAmounts.length !== stablecoinYieldClaimSummaries.length) {
        return null;
    }

    return asBaseCurrencyAmount(
        fiatClaimableAmounts.reduce(
            (total, fiatAmount) => total.plus(fiatAmount),
            new BigNumber(0),
        ),
    );
};
