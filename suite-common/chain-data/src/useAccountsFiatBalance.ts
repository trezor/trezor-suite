import { useMemo } from 'react';

import { useQueries } from '@suite-common/react-query';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import type {
    ChainAccountBalance,
    ChainNetwork,
    FiatRate,
} from '@trezor/network-module-suite-common-types';
import { BigNumber } from '@trezor/utils';

import type { PortfolioAccount } from './PortfolioAccount';
import {
    getChainAccountBalanceQueryOptions,
    getNativeFiatRateQueryOptions,
} from './chainQueryOptions';
import { combineQueryResults } from './combineQueryResults';
import { getChainAccountPairKey, pairChainAccounts } from './pairChainAccounts';

export type UseAccountsFiatBalanceParams = {
    networks: readonly ChainNetwork[];
    accounts: readonly PortfolioAccount[];
    currency: BaseCurrencyCode;
    enabled: boolean;
};

export type AccountsFiatBalance = {
    /** Sum over every chain account that could be valued, `null` when none could. */
    fiatBalance: string | null;
    isPending: boolean;
    hasErrors: boolean;

    /** Some chain account has a balance but no rate (or failed), so the sum is incomplete. */
    isPartial: boolean;

    /** Every chain account lives on a selected network; otherwise the sum leaves some out. */
    isCovered: boolean;
};

/**
 * Fiat value of any set of accounts across any set of networks: the generic reducer over
 * `network.getAccountFiatBalance`. Balances are cached per chain account and rates per network,
 * so a new rate never refetches a balance and an account shown in several places is fetched once.
 */
export const useAccountsFiatBalance = (
    params: UseAccountsFiatBalanceParams,
): AccountsFiatBalance => {
    const { pairs, uniquePairs, uncoveredRefs } = useMemo(
        () => pairChainAccounts(params.networks, params.accounts),
        [params.networks, params.accounts],
    );

    const valuedNetworks = useMemo(() => [...new Set(pairs.map(pair => pair.network))], [pairs]);

    const balances = useQueries({
        queries: uniquePairs.map(pair =>
            getChainAccountBalanceQueryOptions({
                network: pair.network,
                ref: pair.ref,
                enabled: params.enabled,
            }),
        ),
        combine: combineQueryResults<ChainAccountBalance>,
    });

    const rates = useQueries({
        queries: valuedNetworks.map(network =>
            getNativeFiatRateQueryOptions({
                network,
                currency: params.currency,
                enabled: params.enabled,
            }),
        ),
        combine: combineQueryResults<FiatRate | null>,
    });

    return useMemo(() => {
        const balanceByKey = new Map(
            uniquePairs.map((pair, index) => [getChainAccountPairKey(pair), balances.data[index]]),
        );
        const rateByNetwork = new Map(
            valuedNetworks.map((network, index) => [network, rates.data[index]]),
        );
        let total = new BigNumber(0);
        let valuedCount = 0;

        pairs.forEach(pair => {
            const balance = balanceByKey.get(getChainAccountPairKey(pair));
            const rate = rateByNetwork.get(pair.network);

            if (!balance || !rate) return;

            total = total.plus(pair.network.getAccountFiatBalance({ balance, rate }));
            valuedCount++;
        });

        const isPending = balances.isPending || rates.isPending;

        return {
            fiatBalance: valuedCount > 0 || pairs.length === 0 ? total.toString(10) : null,
            isPending,
            hasErrors: balances.hasErrors || rates.hasErrors,
            isPartial: !isPending && valuedCount < pairs.length,
            isCovered: uncoveredRefs.length === 0,
        };
    }, [pairs, uniquePairs, uncoveredRefs, valuedNetworks, balances, rates]);
};
