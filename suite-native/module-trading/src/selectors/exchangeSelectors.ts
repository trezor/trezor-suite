import { CryptoId, ExchangeTrade } from 'invity-api';

import { createWeakMapSelector } from '@suite-common/redux-utils';
import { invariant } from '@suite-common/suite-utils';
import {
    TokenDefinitionsRootState,
    filterKnownTokens,
    getSimpleCoinDefinitionsByNetwork,
    selectTokenDefinitions,
} from '@suite-common/token-definitions';
import {
    TradingRootState as CommonTradingRootState,
    selectTradingExchangeBuyCryptoIds,
    selectTradingExchangeProviders,
    selectTradingExchangeSellCryptoIds,
    toTokenCryptoId,
} from '@suite-common/trading';
import { getNetwork } from '@suite-common/wallet-config';
import {
    AccountsRootState,
    DeviceRootState,
    FiatRatesRootState,
    WalletSettingsRootState,
    selectAccountByKey,
    selectCurrentFiatRates,
    selectLocalCurrency,
    selectVisibleDeviceAccounts,
} from '@suite-common/wallet-core';
import { Account, TokenAddress } from '@suite-common/wallet-types';
import { getAccountFiatBalance, getFiatRateKey, toFiatCurrency } from '@suite-common/wallet-utils';
import { TokensRootState, selectAccountTokenSymbol } from '@suite-native/tokens';

import { SectionListData } from '../hooks/general/useSectionList';
import {
    TradingRootState,
    createMemoizedSelector,
    createMemoizedSelectorWithAccounts,
} from '../reducers';
import { MyAsset, ReceiveAccount } from '../types/general';
import {
    coinInfoToTradeableAsset,
    tradeableAssetSortingComparator,
} from '../utils/general/tradeableAssetUtils';

type ExchangeSelectorsRootState = TradingRootState &
    CommonTradingRootState &
    AccountsRootState &
    DeviceRootState &
    TokenDefinitionsRootState &
    FiatRatesRootState &
    WalletSettingsRootState &
    TokensRootState;

const createExchangeMemoizedSelector =
    createWeakMapSelector.withTypes<ExchangeSelectorsRootState>();

export const selectTradingExchange = (state: TradingRootState) => state.wallet.tradingNew.exchange;

export const selectExchangeSelectedSendAccount = createMemoizedSelectorWithAccounts(
    [state => state, selectTradingExchange],
    (state, { tradingAccountKey }) => {
        if (!tradingAccountKey) {
            return undefined;
        }

        const account = selectAccountByKey(state, tradingAccountKey);

        invariant(account, `Unknown tradingAccountKey: [${tradingAccountKey}]`);

        return account;
    },
);

export const selectExchangeSelectedReceiveAccount = createMemoizedSelectorWithAccounts(
    [state => state, selectTradingExchange],
    (state, { receiveAddress: address, receiveAccountKey }) => {
        if (!receiveAccountKey) {
            return undefined;
        }

        const account = selectAccountByKey(state, receiveAccountKey);

        invariant(account, `Unknown receiveAccountKey: [${receiveAccountKey}]`);

        return { account, address } as ReceiveAccount;
    },
);

export const selectExchangeBuyTradeableAssetsSorted = createMemoizedSelector(
    [
        selectTradingExchangeBuyCryptoIds as unknown as (
            state: TradingRootState,
        ) => ReturnType<typeof selectTradingExchangeBuyCryptoIds>,
        ({ wallet }) => wallet.tradingNew.info.coins,
    ],
    (cryptoIds, coins) => {
        if (!coins || !cryptoIds) {
            return [];
        }

        return cryptoIds
            .map(cryptoId => coinInfoToTradeableAsset(cryptoId, coins[cryptoId]))
            .sort(tradeableAssetSortingComparator);
    },
);

export const selectExchangeQuotes = (state: TradingRootState) =>
    state.wallet.tradingNew.exchange.quotes;

export const selectTradingExchangeIsLoading = (state: TradingRootState) =>
    state.wallet.tradingNew.exchange.isLoading;

const ratingSortingComparator = (
    a: { rate?: number | undefined },
    b: { rate?: number | undefined },
) => (b.rate ?? 0) - (a.rate ?? 0);

export const selectGroupedExchangeQuotes = createMemoizedSelector(
    [
        selectExchangeQuotes,
        selectTradingExchangeProviders as unknown as (
            state: TradingRootState,
        ) => ReturnType<typeof selectTradingExchangeProviders>,
    ],
    (quotes, providers = {}) => {
        const groups = {
            fixed: [] as ExchangeTrade[],
            float: [] as ExchangeTrade[],
            dex: [] as ExchangeTrade[],
        };

        quotes.forEach(quote => {
            const { exchange = '', isDex } = quote;
            const { isFixedRate } = providers[exchange] || {};

            if (isDex) {
                groups.dex.push(quote);
            } else if (isFixedRate) {
                groups.fixed.push(quote);
            } else {
                groups.float.push(quote);
            }
        });

        Object.values(groups).forEach(group => {
            group.sort(ratingSortingComparator);
        });

        return groups;
    },
);

export const selectExchangeAccountsWithTokensSectionList = createExchangeMemoizedSelector(
    [
        selectVisibleDeviceAccounts,
        selectTokenDefinitions,
        selectCurrentFiatRates,
        selectLocalCurrency,
        selectTradingExchangeSellCryptoIds,
        state => state,
    ],
    (accounts: Account[], tokenDefinitions, fiatRates, localCurrency, sellCryptoIds, state) =>
        accounts
            .map<SectionListData<MyAsset, Account>[number]>((account: Account) => {
                const networkTokenDefinitions = getSimpleCoinDefinitionsByNetwork(
                    tokenDefinitions,
                    account.symbol,
                );

                const knownTokens = filterKnownTokens(
                    networkTokenDefinitions,
                    account.symbol,
                    account.tokens ?? [],
                );

                const tokensWithBalance = knownTokens.filter(
                    token => parseFloat(token?.balance ?? '0') > 0,
                );

                const tokens: MyAsset[] = tokensWithBalance
                    .map(token => {
                        const fiatRateKey = getFiatRateKey(
                            account.symbol,
                            localCurrency,
                            token.contract as TokenAddress,
                        );
                        const rate = fiatRates?.[fiatRateKey]?.rate;
                        const fiatBalance =
                            rate && token.balance
                                ? toFiatCurrency({ amount: token.balance, rate })
                                : null;

                        const tokenSymbol = selectAccountTokenSymbol(
                            state,
                            account.key,
                            token.contract as TokenAddress,
                        );
                        const cryptoId = toTokenCryptoId(account.symbol, token.contract);

                        return {
                            symbol: account.symbol,
                            name: token.name ?? token.symbol ?? '',
                            balance: token.balance ?? '0',
                            fiatBalance,
                            tokenSymbol,
                            contract: token.contract as TokenAddress,
                            cryptoId,
                            isEnabled: sellCryptoIds.includes(cryptoId),
                            fiatRateKey,
                            rate,
                        };
                    })
                    .sort((a, b) => {
                        // sellable (isEnabled) assets first
                        if (a.isEnabled !== b.isEnabled) {
                            return a.isEnabled ? -1 : 1;
                        }

                        // bigger fiatBalance first
                        const aFiatBalance = a.fiatBalance ? Number(a.fiatBalance) : 0;
                        const bFiatBalance = b.fiatBalance ? Number(b.fiatBalance) : 0;

                        return bFiatBalance - aFiatBalance;
                    });

                const cryptoId = getNetwork(account.symbol).tradeCryptoId as CryptoId;

                const accountAsset = {
                    symbol: account.symbol,
                    name: account.accountLabel || '',
                    balance: account.formattedBalance,
                    fiatBalance: getAccountFiatBalance({
                        account,
                        localCurrency,
                        rates: fiatRates,
                        shouldIncludeStaking: false,
                        shouldIncludeTokens: false,
                    }),
                    cryptoId,
                    isEnabled: sellCryptoIds.includes(cryptoId),
                };

                const assets: MyAsset[] = [
                    ...(parseFloat(account.balance) > 0 ? [accountAsset] : []),
                    ...tokens,
                ];

                return {
                    key: `section_${account.key}`,
                    label: account.accountLabel ?? '',
                    sectionData: account,
                    data: assets,
                };
            })
            .filter(section => section.data.length > 0),
);
