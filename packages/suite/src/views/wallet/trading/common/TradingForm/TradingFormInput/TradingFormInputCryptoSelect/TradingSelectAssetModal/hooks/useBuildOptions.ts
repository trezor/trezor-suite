import { useMemo } from 'react';

import { TradingCryptoSelectOptionProps, cryptoIdToNetwork } from '@suite-common/trading';
import { NetworkSymbolExtended, isNetworkSymbol } from '@suite-common/wallet-config';
import {
    selectAllAccountsToList,
    selectBaseCurrency,
    selectCurrentFiatRates,
} from '@suite-common/wallet-core';
import { RatesByKey, TokenAddress } from '@suite-common/wallet-types';
import { getFiatRateKey, toFiatCurrency } from '@suite-common/wallet-utils';
import { BaseCurrencyCode, TokenInfo } from '@trezor/blockchain-link-types';

import { useSelector } from 'src/hooks/suite';
import { SelectAssetOptionCurrencyProps, SelectAssetOptionProps } from 'src/types/trading/trading';
import { Account } from 'src/types/wallet';

type MinimalTokenInfo = Pick<TokenInfo, 'contract' | 'balance'>;
type TokensInfoByContract = Record<Lowercase<TokenInfo['contract']>, MinimalTokenInfo>;

function groupAccountsWithTokensByNetworkSymbol(
    accounts: Account[],
): Record<NetworkSymbolExtended, TokensInfoByContract[]> {
    return accounts
        .filter(account => account.tokens?.length)
        .reduce(
            (acc, account) => {
                if (!acc[account.symbol]) {
                    acc[account.symbol] = [];
                }

                if (account.tokens?.length) {
                    const tokensByContract = Object.fromEntries(
                        account.tokens.map(({ contract, balance }) => [
                            contract.toLowerCase(),
                            {
                                contract,
                                balance,
                            },
                        ]),
                    ) as TokensInfoByContract;

                    acc[account.symbol].push(tokensByContract);
                }

                return acc;
            },
            {} as Record<NetworkSymbolExtended, TokensInfoByContract[]>,
        );
}

type AccountsWithTokensGroupedByNetworkSymbol = ReturnType<
    typeof groupAccountsWithTokensByNetworkSymbol
>;

function findTokenInNetworkAccounts(
    accountsWithTokensGroupedByNetworkSymbol: AccountsWithTokensGroupedByNetworkSymbol,
    networkSymbol: NetworkSymbolExtended,
    contractAddress: TokenAddress,
): MinimalTokenInfo | null {
    const networkAccounts = accountsWithTokensGroupedByNetworkSymbol[networkSymbol];

    if (!networkAccounts) {
        return null;
    }

    const lowerContractAddress = contractAddress.toLowerCase() as Lowercase<TokenAddress>;

    for (const accountTokens of networkAccounts) {
        const tokenInfo = accountTokens[lowerContractAddress];

        if (tokenInfo) {
            return tokenInfo;
        }
    }

    return null;
}

function getTokenBalanceInFiat(
    networkSymbol: NetworkSymbolExtended,
    { balance, contract }: MinimalTokenInfo,
    fiatRates: RatesByKey,
    fiatCurrency: BaseCurrencyCode,
) {
    if (!balance || !networkSymbol || !isNetworkSymbol(networkSymbol) || !contract) {
        return null;
    }

    const fiatRateKey = getFiatRateKey(networkSymbol, fiatCurrency, contract as TokenAddress);
    const rate = fiatRates[fiatRateKey]?.rate;

    return toFiatCurrency({ amount: balance, rate });
}

interface GetTokenBalanceProps {
    contractAddress: string;
    accountsWithTokensGroupedByNetworkSymbol: AccountsWithTokensGroupedByNetworkSymbol;
    symbol: NetworkSymbolExtended;
    currentRates: RatesByKey;
    fiatCurrency: BaseCurrencyCode;
}

function getTokenBalance({
    contractAddress,
    accountsWithTokensGroupedByNetworkSymbol,
    symbol,
    currentRates,
    fiatCurrency,
}: GetTokenBalanceProps) {
    const tokenInfo = findTokenInNetworkAccounts(
        accountsWithTokensGroupedByNetworkSymbol,
        symbol,
        contractAddress as TokenAddress,
    );

    if (!tokenInfo?.balance) {
        return undefined;
    }

    const tokenBalanceInFiat = getTokenBalanceInFiat(symbol, tokenInfo, currentRates, fiatCurrency);

    return {
        baseAmount: tokenInfo.balance,
        fiatAmount: tokenBalanceInFiat,
    };
}

function orderAssetOptionsByFiatBalanceInDesc(
    assetA: SelectAssetOptionCurrencyProps,
    assetB: SelectAssetOptionCurrencyProps,
) {
    if (
        assetA.tokenBalance?.fiatAmount?.gt(assetB.tokenBalance?.fiatAmount ?? '0') ||
        (assetA.tokenBalance?.baseAmount && !assetB.tokenBalance?.baseAmount)
    ) {
        return -1;
    }

    return 0;
}

/**
 * Take all `TradingCryptoSelectOptionProps[]`:
 * 1. Select only `currency` options
 * 2. Map to `SelectAssetOptionCurrencyProps`
 * 3. Get token balance for each option
 * 4. Sort options by fiat balance in descending order
 */
export function useBuildOptions(
    rawOptions: TradingCryptoSelectOptionProps[],
    sortTokensByFiatBalanceInDesc: boolean,
): SelectAssetOptionProps[] {
    const currentRates = useSelector(selectCurrentFiatRates);
    const accounts = useSelector(selectAllAccountsToList);
    const accountsWithTokensGroupedByNetworkSymbol = useMemo(
        () => groupAccountsWithTokensByNetworkSymbol(accounts),
        [accounts],
    );
    const fiatCurrency = useSelector(selectBaseCurrency);

    return useMemo(() => {
        const filteredOptions = rawOptions
            .filter(option => option.type === 'currency')
            .map(option => {
                const network = cryptoIdToNetwork(option.value);

                if (!network) return null;

                const extendedOption: SelectAssetOptionCurrencyProps = {
                    ...option,
                    ticker: option.ticker || option.label,
                    symbol: network.symbol,
                    contractAddress: option.contractAddress ?? null,
                };

                const { symbol, contractAddress } = extendedOption;
                const tokenBalance =
                    contractAddress && currentRates && sortTokensByFiatBalanceInDesc
                        ? getTokenBalance({
                              contractAddress,
                              accountsWithTokensGroupedByNetworkSymbol,
                              symbol,
                              currentRates,
                              fiatCurrency,
                          })
                        : undefined;

                return {
                    ...extendedOption,
                    tokenBalance,
                } satisfies SelectAssetOptionCurrencyProps;
            })
            .filter(option => option !== null);

        return sortTokensByFiatBalanceInDesc
            ? filteredOptions.toSorted(orderAssetOptionsByFiatBalanceInDesc)
            : filteredOptions;
    }, [
        rawOptions,
        currentRates,
        sortTokensByFiatBalanceInDesc,
        accountsWithTokensGroupedByNetworkSymbol,
        fiatCurrency,
    ]);
}
