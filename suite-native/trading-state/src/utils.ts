import { type TradingExchangeType, type TradingSellType } from '@suite-common/trading';
import { getNetworkByCoingeckoId, getNetworkByTradeCryptoId } from '@suite-common/wallet-config';
import { getFormDraftKey } from '@suite-common/wallet-utils';
import { type TradeableAsset } from '@suite-native/trading-types';
import { exhaustive } from '@trezor/type-utils';

export const getFormDraftKeyByTradeType = (tradeType: TradingSellType | TradingExchangeType) => {
    switch (tradeType) {
        case 'exchange':
            return getFormDraftKey('trading-exchange', '');
        case 'sell':
            return getFormDraftKey('trading-sell', '');
        default:
            return exhaustive(tradeType);
    }
};

export const getAssetByEnabledNetworksFilter =
    (areDebugOnlyNetworksEnabled: boolean, areExperimentalOnlyNetworksEnabled: boolean) =>
    ({ networkId }: TradeableAsset) => {
        const network = getNetworkByTradeCryptoId(networkId) ?? getNetworkByCoingeckoId(networkId);

        if (!network) {
            return false;
        }

        if (network.isDebugOnlyNetwork) {
            return areDebugOnlyNetworksEnabled;
        }

        if (network.isExperimentalOnlyNetwork) {
            return areExperimentalOnlyNetworksEnabled;
        }

        return true;
    };

const DEFAULT_FIAT_CURRENCY_FALLBACK = 'usd';

type GetDefaultFiatCurrencyParams = {
    baseCurrency: string;
    supportedFiatCurrencies: ReadonlySet<string>;
    suggestedFiatCurrency?: string;
};

export const getDefaultFiatCurrency = ({
    baseCurrency,
    supportedFiatCurrencies,
    suggestedFiatCurrency,
}: GetDefaultFiatCurrencyParams) => {
    const normalizedBaseCurrency = baseCurrency.toLowerCase();

    if (supportedFiatCurrencies.has(normalizedBaseCurrency)) {
        return normalizedBaseCurrency;
    }

    return (suggestedFiatCurrency || DEFAULT_FIAT_CURRENCY_FALLBACK).toLowerCase();
};
