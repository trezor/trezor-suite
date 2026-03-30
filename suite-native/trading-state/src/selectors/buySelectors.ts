import { Platform } from 'react-native';

import type { BuyTrade } from 'invity-api';

import { returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { invariant } from '@suite-common/suite-utils';
import {
    type TradingCountryCode,
    type TradingPaymentMethodProps,
    bestBuyQuotePerPaymentMethodProjection,
    getCurrencyLabel,
    getTradingQuotesByPaymentMethod,
    nonSanctionedRegional,
    selectTradingBuyInfo,
    selectTradingBuySupportedCryptoIds,
    selectValidTradingBuyQuotes,
} from '@suite-common/trading';
import { selectAccountByKey } from '@suite-common/wallet-core';
import { FeatureFlag, selectIsFeatureFlagEnabled } from '@suite-native/feature-flags';
import {
    coinInfoToTradeableAsset,
    getReceiveAccountFromAccountAndAddressString,
} from '@suite-native/trading-atoms';
import { type BuyFormValues, type FiatCurrencyItem } from '@suite-native/trading-types';

import { getAssetByEnabledNetworksFilter } from '../utils';
import { selectTradingResidenceCountry } from './residenceSelectors';
import {
    type TradingRootState,
    createMemoizedSelector,
    createMemoizedSelectorWithAccounts,
    createTradingWithFeatureFlagsMemoizedSelector,
} from '../reducers';

const DEFAULT_FIAT_CURRENCY_FALLBACK = 'USD';

export const selectTradingBuy = (state: TradingRootState) => state.wallet.trading.buy;

export const selectBuySelectedReceiveAccount = createMemoizedSelectorWithAccounts(
    [state => state, selectTradingBuy],
    (state, { receiveAddress, tradingAccountKey }) => {
        if (!tradingAccountKey) {
            return undefined;
        }

        const account = selectAccountByKey(state, tradingAccountKey);
        invariant(account, `Unknown tradingAccountKey: [${tradingAccountKey}]`);

        return getReceiveAccountFromAccountAndAddressString(account, receiveAddress);
    },
);

export const selectBuySupportedFiatCurrencies = (state: TradingRootState) =>
    returnStableArrayIfEmpty(selectTradingBuy(state).buyInfo?.supportedFiatCurrencies);

export const selectBuyTradeableAssets = createTradingWithFeatureFlagsMemoizedSelector(
    [
        selectTradingBuySupportedCryptoIds as unknown as (
            state: TradingRootState,
        ) => ReturnType<typeof selectTradingBuySupportedCryptoIds>,
        ({ wallet }) => wallet.trading.info.coins,
        state => selectIsFeatureFlagEnabled(state, FeatureFlag.AreDebugOnlyNetworksEnabled),
        state => selectIsFeatureFlagEnabled(state, FeatureFlag.AreExperimentalOnlyNetworksEnabled),
    ],
    (cryptoIds, coins, areDebugOnlyNetworksEnabled, areExperimentalOnlyNetworksEnabled) => {
        if (!coins || !cryptoIds) {
            return [];
        }

        return cryptoIds
            .map(cryptoId => coinInfoToTradeableAsset(cryptoId, coins[cryptoId]))
            .filter(
                getAssetByEnabledNetworksFilter(
                    areDebugOnlyNetworksEnabled,
                    areExperimentalOnlyNetworksEnabled,
                ),
            );
    },
);

export const selectBuyFormDefaultValues = createMemoizedSelector(
    [
        selectTradingBuyInfo as unknown as (
            state: TradingRootState,
        ) => ReturnType<typeof selectTradingBuyInfo>,
        ({ wallet }) => wallet.trading.info.coins,
        selectTradingResidenceCountry,
    ],
    (buyInfo, coins, residenceCountry) => {
        if (!buyInfo || !coins) {
            return {} as Partial<BuyFormValues>;
        }

        const { suggestedFiatCurrency } = buyInfo.buyInfo;
        const country = residenceCountry ?? (buyInfo.buyInfo.country as TradingCountryCode);

        const fiatCurrency = suggestedFiatCurrency || DEFAULT_FIAT_CURRENCY_FALLBACK;
        const countryDefaultValue =
            nonSanctionedRegional.getCountryOptionWithWorldwideFallback(country);

        return {
            fiatCurrency: fiatCurrency.toLowerCase(),
            country: countryDefaultValue,
            amountInCrypto: false,
        } as Partial<BuyFormValues>;
    },
);

export const selectBuySupportedFiatCurrenciesList = createMemoizedSelector(
    [selectBuySupportedFiatCurrencies],
    (currencies): FiatCurrencyItem[] =>
        [...new Set(currencies)].map(code => ({
            value: code,
            displayValue: code.toUpperCase(),
            label: getCurrencyLabel(code),
        })),
);

export const selectBuyAmountLimits = (state: TradingRootState) =>
    selectTradingBuy(state).amountLimits;

export const selectValidTradingBuyQuotesNative = createMemoizedSelector(
    [
        selectValidTradingBuyQuotes as unknown as (
            state: TradingRootState,
        ) => ReturnType<typeof selectValidTradingBuyQuotes>,
    ],
    quotes => {
        const isProviderAllowed = ({ exchange }: BuyTrade) => exchange !== 'simplex';
        const isAllowedOnPlatform = Platform.select<(quote: BuyTrade) => boolean>({
            ios: () => true,
            default: ({ paymentMethod }) => paymentMethod !== 'applePay',
        });

        return quotes.filter(isProviderAllowed).filter(isAllowedOnPlatform);
    },
);

export const selectBuyBestQuotesForAvailablePaymentMethods = createMemoizedSelector(
    [selectValidTradingBuyQuotesNative],
    bestBuyQuotePerPaymentMethodProjection,
);

export const selectBuyQuotesByPaymentMethodNative = createMemoizedSelector(
    [
        selectValidTradingBuyQuotesNative,
        (_: TradingRootState, paymentMethod: TradingPaymentMethodProps | undefined) =>
            paymentMethod,
    ],
    (quotes, paymentMethod) => ({
        fixed: paymentMethod ? getTradingQuotesByPaymentMethod<'buy'>(quotes, paymentMethod) : [],
    }),
);
