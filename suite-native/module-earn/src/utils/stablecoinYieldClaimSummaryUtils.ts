import {
    type ChainRewardsWithFiat,
    type MerklRewardsParams,
} from '@suite-common/earn-stablecoin-api';
import { getNetwork } from '@suite-common/wallet-config';
import { type Account, asBaseCurrencyAmount } from '@suite-common/wallet-types';
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

export const buildStablecoinYieldClaimSummaries = ({
    activeAccounts,
    chainsRewardsWithFiat,
}: BuildStablecoinYieldClaimSummariesParams): StablecoinYieldClaimSummary[] => {
    const chainsRewardsByAccountKey = new Map(
        chainsRewardsWithFiat.map(chainRewards => [
            getChainAddressKey({
                chainId: chainRewards.chainId,
                address: chainRewards.address,
            }),
            chainRewards,
        ]),
    );

    return activeAccounts.flatMap(account => {
        const accountChainAddressKey = getAccountChainAddressKey(account);

        if (accountChainAddressKey === null) {
            return [];
        }

        const chainRewards = chainsRewardsByAccountKey.get(accountChainAddressKey);

        if (!chainRewards) {
            return [];
        }

        const claimableRewards = chainRewards.rewards.filter(reward =>
            new BigNumber(reward.claimable).gt(0),
        );

        if (claimableRewards.length === 0) {
            return [];
        }

        const fiatClaimableAmounts = claimableRewards.flatMap(reward =>
            reward.fiat.claimable === null ? [] : [reward.fiat.claimable],
        );

        const fiatClaimableAmount =
            fiatClaimableAmounts.length === claimableRewards.length
                ? asBaseCurrencyAmount(
                      fiatClaimableAmounts.reduce(
                          (total, fiatClaimable) => total.plus(fiatClaimable),
                          new BigNumber(0),
                      ),
                  )
                : null;

        return [
            {
                type: 'stablecoin-yield',
                accountKey: account.key,
                accountLabel: account.accountLabel,
                accountDescriptor: account.descriptor,
                networkSymbol: account.symbol,
                claimableRewardsCount: claimableRewards.length,
                fiatClaimableAmount,
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
