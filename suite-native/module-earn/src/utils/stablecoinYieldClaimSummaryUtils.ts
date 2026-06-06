import {
    type ChainRewardsWithFiat,
    type MerklRewardsParams,
} from '@suite-common/earn-stablecoin-api';
import { getNetwork } from '@suite-common/wallet-config';
import { type YieldFlowCompleteRewardItem } from '@suite-common/wallet-core';
import {
    type Account,
    type BaseCurrencyAmount,
    asBaseCurrencyAmount,
    toTokenAddress,
} from '@suite-common/wallet-types';
import { asAmountSubunit, subunitsToUnits } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { type StablecoinYieldClaimSummary, type StablecoinYieldEarnItem } from '../types';
import { hasPositiveContractTokenBalance } from './contractTokenBalanceUtils';

type GetActiveStablecoinYieldClaimAccountsParams = {
    activeItems: StablecoinYieldEarnItem[];
    accounts: Account[];
};

type BuildStablecoinYieldClaimSummariesParams = {
    activeAccounts: Account[];
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

export const getActiveStablecoinYieldClaimAccounts = ({
    activeItems,
    accounts,
}: GetActiveStablecoinYieldClaimAccountsParams): Account[] => {
    const accountsByKey = new Map(accounts.map(account => [account.key, account]));
    const activeAccountsByKey = new Map<Account['key'], Account>();

    for (const item of activeItems) {
        if (item.accountKey === null) {
            continue;
        }

        const account = accountsByKey.get(item.accountKey);

        if (!account) {
            continue;
        }

        if (!hasPositiveContractTokenBalance(account, item.receiptTokenContract)) {
            continue;
        }

        activeAccountsByKey.set(item.accountKey, account);
    }

    return Array.from(activeAccountsByKey.values());
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

export const getStablecoinYieldClaimRewardsSnapshot = ({
    account,
    rewards,
}: StablecoinYieldAccountRewards): YieldFlowCompleteRewardItem[] =>
    rewards.map(reward => ({
        token: {
            networkSymbol: account.symbol,
            symbol: reward.token.symbol,
            decimals: reward.token.decimals,
            contractAddress: toTokenAddress(reward.token.address),
        },
        value: subunitsToUnits({
            value: asAmountSubunit(new BigNumber(reward.claimable)),
            decimals: reward.token.decimals,
        }).toString(),
        fiatValue: reward.fiat.claimable?.toString() ?? null,
    }));

export const buildStablecoinYieldClaimSummaries = ({
    activeAccounts,
    chainsRewardsWithFiat,
}: BuildStablecoinYieldClaimSummariesParams): StablecoinYieldClaimSummary[] => {
    const chainsRewardsByAccountKey = getChainsRewardsByAccountKey(chainsRewardsWithFiat);

    return activeAccounts.flatMap(account => {
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
                accountLabel: account.accountLabel,
                accountDescriptor: account.descriptor,
                networkSymbol: account.symbol,
                claimableRewardsCount: accountRewards.rewards.length,
                fiatClaimableAmount: accountRewards.totalFiatClaimableAmount,
            },
        ];
    });
};

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
