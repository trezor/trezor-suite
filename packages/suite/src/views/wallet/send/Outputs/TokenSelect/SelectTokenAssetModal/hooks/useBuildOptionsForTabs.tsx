import { useMemo } from 'react';

import { Translation } from '@suite/intl';
import { type TokenDefinitions, selectCoinDefinitions } from '@suite-common/token-definitions';
import {
    type NetworkSymbol,
    getCoingeckoId,
    getNetworkDisplaySymbolName,
} from '@suite-common/wallet-config';
import { selectBaseCurrency, selectCurrentFiatRates } from '@suite-common/wallet-core';
import { toFiatCurrency } from '@suite-common/wallet-utils';
import { type AssetProps, ITEM_HEIGHT, type TokenTab } from '@trezor/product-components';

import { useSelector } from 'src/hooks/suite';
import { type Account } from 'src/types/wallet';
import {
    type EnahncedTokenInfoWithFiat,
    enhanceTokensWithRates,
    getTokens,
    sortTokensWithRates,
} from 'src/utils/wallet/tokenUtils';

const createTokenOption = (
    token: EnahncedTokenInfoWithFiat,
    symbol: NetworkSymbol,
    verified: boolean,
): AssetProps => ({
    ticker: token.symbol ?? '',
    symbol,
    cryptoName: token.name,
    badge: verified ? undefined : <Translation id="TR_UNRECOGNIZED" />,
    coingeckoId: getCoingeckoId(symbol) ?? '',
    contractAddress: token.contract,
    shouldTryToFetch: verified,
    height: ITEM_HEIGHT,
    tokenBalance:
        token.balance && verified
            ? {
                  baseAmount: token.balance,
                  baseSymbol: token.symbol ?? '',
                  fiatAmount: toFiatCurrency({ amount: token.balance, rate: token.fiatRate?.rate }),
              }
            : undefined,
});

type TokensOptionsForAllTabs = Record<TokenTab['tab'], AssetProps[]>;

const buildTokenOptions = (
    accountTokens: EnahncedTokenInfoWithFiat[],
    symbol: NetworkSymbol,
    coinDefinitions: TokenDefinitions['coin'],
): TokensOptionsForAllTabs => {
    const tokens = getTokens<EnahncedTokenInfoWithFiat>({
        tokens: accountTokens,
        symbol,
        tokenDefinitions: coinDefinitions,
    });

    const result: TokensOptionsForAllTabs = {
        hidden: [],
        tokens: [],
    };

    // this represents the native token
    result.tokens.push({
        ticker: symbol,
        symbol,
        cryptoName: getNetworkDisplaySymbolName(symbol),
        badge: undefined,
        contractAddress: null,
        height: ITEM_HEIGHT,
    });

    tokens.shownWithBalance.forEach(token =>
        result.tokens.push(createTokenOption(token, symbol, true)),
    );

    tokens.hiddenWithBalance.forEach(token =>
        result.hidden.push(createTokenOption(token, symbol, true)),
    );

    tokens.unverifiedWithBalance.forEach(token =>
        result.hidden.push(createTokenOption(token, symbol, false)),
    );

    return result;
};

export function useBuildOptionsForTabs(account: Account): TokensOptionsForAllTabs {
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const fiatRates = useSelector(selectCurrentFiatRates);
    const coinDefinitions = useSelector(state => selectCoinDefinitions(state, account.symbol));

    const tabsOptions = useMemo(() => {
        const tokensWithRates = enhanceTokensWithRates(
            account.tokens,
            baseCurrencyCode,
            account.symbol,
            fiatRates,
        );

        const sortedTokensWithRates = tokensWithRates.sort(sortTokensWithRates);

        return buildTokenOptions(sortedTokensWithRates, account.symbol, coinDefinitions);
    }, [account.tokens, account.symbol, baseCurrencyCode, fiatRates, coinDefinitions]);

    return tabsOptions;
}
