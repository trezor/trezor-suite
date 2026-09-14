import { createWeakMapSelector } from '@suite-common/redux-utils';
import { type NetworksRootState, selectNetworkConfigAccessors } from '@suite-common/networks';
import { Platform } from 'react-native';

import type { BuyTrade } from 'invity-api';

import { returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import {
    type TradingCountryCode,
    type TradingPaymentMethodProps,
    bestBuyQuotePerPaymentMethodProjection,
    getCurrencyLabel,
    getDefaultCountrySubdivision,
    getTradingQuotesByPaymentMethod,
    nonSanctionedRegional,
    selectTradingBuyInfo,
    selectTradingBuySupportedCryptoIds,
    selectValidTradingBuyQuotes,
} from '@suite-common/trading';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import {
    type FeatureFlagsRootState,
    FeatureFlag,
    selectIsFeatureFlagEnabled,
} from '@suite-native/feature-flags';
import {
    coinInfoToTradeableAsset,
    getReceiveAccountFromAccountAndAddressString,
} from '@suite-native/trading-atoms';
import { type BuyFormValues, type FiatCurrencyItem } from '@suite-native/trading-types';
import { unique } from '@trezor/utils';

import { getAssetByEnabledNetworksFilter } from '../utils';
import {
    selectTradingResidenceCountry,
    selectTradingResidenceCountrySubdivision,
} from './residenceSelectors';
import { type TradingRootState, createMemoizedSelector } from '../reducers';

const DEFAULT_FIAT_CURRENCY_FALLBACK = 'USD';

export const selectTradingBuy = (state: TradingRootState) => state.wallet.trading.buy;

const selectBuyReceiveAccount = (state: TradingRootState & AccountsRootState) => {
    const { tradingAccountKey } = selectTradingBuy(state);

    return tradingAccountKey ? selectAccountByKey(state, tradingAccountKey) : null;
};

const selectTradingBuyReceiveAddress = (state: TradingRootState) =>
    selectTradingBuy(state).receiveAddress;

export const selectBuySelectedReceiveAccount = createWeakMapSelector(
    [selectNetworkConfigAccessors, selectBuyReceiveAccount, selectTradingBuyReceiveAddress],
    (networkConfigDeps, account, receiveAddress) => {
        if (!account) {
            return undefined;
        }

        return getReceiveAccountFromAccountAndAddressString(
            networkConfigDeps,
            account,
            receiveAddress,
        );
    },
);

export const selectBuySupportedFiatCurrencies = (state: TradingRootState) =>
    returnStableArrayIfEmpty(selectTradingBuy(state).buyInfo?.supportedFiatCurrencies);

export const selectBuyTradeableAssets = createWeakMapSelector.withTypes<
    TradingRootState & FeatureFlagsRootState & NetworksRootState
>()(
    [
        selectNetworkConfigAccessors,
        selectTradingBuySupportedCryptoIds,
        ({ wallet }) => wallet.trading.info.coins,
        state => selectIsFeatureFlagEnabled(state, FeatureFlag.AreDebugOnlyNetworksEnabled),
        state => selectIsFeatureFlagEnabled(state, FeatureFlag.AreExperimentalOnlyNetworksEnabled),
    ],
    (
        networkConfigDeps,
        cryptoIds,
        coins,
        areDebugOnlyNetworksEnabled,
        areExperimentalOnlyNetworksEnabled,
    ) => {
        if (!coins || !cryptoIds) {
            return [];
        }

        return cryptoIds
            .flatMap(cryptoId => {
                const coinInfo = coins[cryptoId];
                if (!coinInfo) return [];

                return [coinInfoToTradeableAsset(networkConfigDeps, cryptoId, coinInfo)];
            })
            .filter(
                getAssetByEnabledNetworksFilter(
                    networkConfigDeps,
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
        selectTradingResidenceCountrySubdivision,
    ],
    (buyInfo, coins, residenceCountry, residenceCountrySubdivision) => {
        if (!buyInfo || !coins) {
            return {};
        }

        const { suggestedFiatCurrency } = buyInfo.buyInfo;
        const country = residenceCountry ?? (buyInfo.buyInfo.country as TradingCountryCode);

        const fiatCurrency = suggestedFiatCurrency || DEFAULT_FIAT_CURRENCY_FALLBACK;
        const countryDefaultValue =
            nonSanctionedRegional.getCountryOptionWithWorldwideFallback(country);

        const countrySubdivisionDefaultValue = getDefaultCountrySubdivision(
            residenceCountrySubdivision,
            countryDefaultValue.value,
        );

        return {
            fiatCurrency: fiatCurrency.toLowerCase(),
            country: countryDefaultValue,
            countrySubdivision: countrySubdivisionDefaultValue,
            amountInCrypto: false,
        } as Partial<BuyFormValues>;
    },
);

export const selectBuySupportedFiatCurrenciesList = createMemoizedSelector(
    [selectBuySupportedFiatCurrencies],
    (currencies): FiatCurrencyItem[] =>
        unique(currencies).map(code => ({
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
