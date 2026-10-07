import { useMemo } from 'react';

import { useQueries } from '@suite-common/react-query';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import type {
    ChainAccountBalance,
    ChainNetwork,
    ChainTokenBalance,
    FiatRate,
} from '@trezor/network-module-suite-common-types';
import { BigNumber } from '@trezor/utils';

import type { ChainAsset } from './ChainAsset';
import type { PortfolioAccount } from './PortfolioAccount';
import {
    getChainAccountBalanceQueryOptions,
    getChainAccountTokensQueryOptions,
    getNativeFiatRateQueryOptions,
    getTokenFiatRateQueryOptions,
} from './chainQueryOptions';
import { combineQueryResults } from './combineQueryResults';
import {
    type ChainAccountPair,
    getChainAccountPairKey,
    pairChainAccounts,
} from './pairChainAccounts';

export type UseChainAssetsParams = {
    networks: readonly ChainNetwork[];
    accounts: readonly PortfolioAccount[];
    currency: BaseCurrencyCode;
    enabled: boolean;
};

export type ChainAssets = {
    /** Every asset of every chain account on a selected network, unmerged. */
    assets: readonly ChainAsset[];
    isPending: boolean;
    hasErrors: boolean;
};

type TokenRateEntry = { network: ChainNetwork; contract: string };

const getTokenRateKey = (network: ChainNetwork, contract: string) =>
    `${network.symbol}/${contract}`;

const hasTokens = (pair: ChainAccountPair) => pair.network.getTokens !== undefined;

const toNativeAsset = (
    pair: ChainAccountPair,
    balance: ChainAccountBalance,
    rate: FiatRate | null | undefined,
): ChainAsset => ({
    accountId: pair.accountId,
    ref: pair.ref,
    kind: 'native',
    symbol: pair.network.nativeAsset.symbol,
    name: pair.network.nativeAsset.name,
    amount: balance.displayBalance,
    fiatValue: rate ? pair.network.getAccountFiatBalance({ balance, rate }) : null,
});

const toTokenAsset = (
    pair: ChainAccountPair,
    token: ChainTokenBalance,
    rate: FiatRate | null | undefined,
): ChainAsset => ({
    accountId: pair.accountId,
    ref: pair.ref,
    kind: 'token',
    contract: token.contract,
    standard: token.standard,
    decimals: token.decimals,
    symbol: token.symbol,
    name: token.name,
    amount: token.balance,
    fiatValue: rate ? new BigNumber(token.balance).times(rate.rate).toString(10) : null,
});

/**
 * The assets the given accounts hold across the given networks: each network's native coin and,
 * where the network has them, its tokens. Balances, token lists and rates are cached separately,
 * so an account shown elsewhere is not fetched twice and a new rate never refetches a balance.
 */
export const useChainAssets = (params: UseChainAssetsParams): ChainAssets => {
    const { pairs, uniquePairs } = useMemo(
        () => pairChainAccounts(params.networks, params.accounts),
        [params.networks, params.accounts],
    );
    // Only networks with token capabilities get token queries: a skipped query never settles.
    const tokenPairs = useMemo(() => uniquePairs.filter(hasTokens), [uniquePairs]);
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
    const tokens = useQueries({
        queries: tokenPairs.map(pair =>
            getChainAccountTokensQueryOptions({
                network: pair.network,
                ref: pair.ref,
                enabled: params.enabled,
            }),
        ),
        combine: combineQueryResults<readonly ChainTokenBalance[]>,
    });
    const nativeRates = useQueries({
        queries: valuedNetworks.map(network =>
            getNativeFiatRateQueryOptions({
                network,
                currency: params.currency,
                enabled: params.enabled,
            }),
        ),
        combine: combineQueryResults<FiatRate | null>,
    });

    const tokenRateEntries = useMemo(() => {
        const entries = new Map<string, TokenRateEntry>();
        tokenPairs.forEach((pair, index) =>
            tokens.data[index]?.forEach(({ contract }) =>
                entries.set(getTokenRateKey(pair.network, contract), {
                    network: pair.network,
                    contract,
                }),
            ),
        );

        return [...entries.values()];
    }, [tokenPairs, tokens.data]);

    const tokenRates = useQueries({
        queries: tokenRateEntries.map(entry =>
            getTokenFiatRateQueryOptions({
                network: entry.network,
                contract: entry.contract,
                currency: params.currency,
                enabled: params.enabled,
            }),
        ),
        combine: combineQueryResults<FiatRate | null>,
    });

    return useMemo(() => {
        const nativeRateByNetwork = new Map(
            valuedNetworks.map((network, index) => [network, nativeRates.data[index]]),
        );
        const balanceByKey = new Map(
            uniquePairs.map((pair, index) => [getChainAccountPairKey(pair), balances.data[index]]),
        );
        const tokensByKey = new Map(
            tokenPairs.map((pair, index) => [getChainAccountPairKey(pair), tokens.data[index]]),
        );
        const tokenRateByKey = new Map(
            tokenRateEntries.map((entry, index) => [
                getTokenRateKey(entry.network, entry.contract),
                tokenRates.data[index],
            ]),
        );

        const assets = pairs.flatMap(pair => {
            const key = getChainAccountPairKey(pair);
            const balance = balanceByKey.get(key);
            const nativeAssets = balance
                ? [toNativeAsset(pair, balance, nativeRateByNetwork.get(pair.network))]
                : [];
            const tokenAssets = (tokensByKey.get(key) ?? []).map(token =>
                toTokenAsset(
                    pair,
                    token,
                    tokenRateByKey.get(getTokenRateKey(pair.network, token.contract)),
                ),
            );

            return [...nativeAssets, ...tokenAssets];
        });

        return {
            assets,
            isPending:
                balances.isPending ||
                tokens.isPending ||
                nativeRates.isPending ||
                tokenRates.isPending,
            hasErrors:
                balances.hasErrors ||
                tokens.hasErrors ||
                nativeRates.hasErrors ||
                tokenRates.hasErrors,
        };
    }, [
        pairs,
        uniquePairs,
        tokenPairs,
        valuedNetworks,
        tokenRateEntries,
        balances,
        tokens,
        nativeRates,
        tokenRates,
    ]);
};
