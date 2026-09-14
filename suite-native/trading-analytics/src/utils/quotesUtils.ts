import { type NetworkConfigDeps } from '@suite-common/networks';
import type { BuyTrade, CoinInfo, SellFiatTrade } from 'invity-api';

import { cryptoIdToNetwork } from '@suite-common/trading';
import { coinInfoToTradeableAsset } from '@suite-native/trading-atoms';

export type GetAnalyticsTradingBuyPayloadProps = {
    quote: BuyTrade | undefined;
    coinInfo: CoinInfo | undefined;
};

export const getAnalyticsTradingBuyPayload = (
    networkConfigDeps: NetworkConfigDeps,
    { quote, coinInfo }: GetAnalyticsTradingBuyPayloadProps,
) => {
    if (!coinInfo || !quote?.receiveCurrency) {
        return null;
    }

    const tradeableAsset = coinInfoToTradeableAsset(
        networkConfigDeps,
        quote.receiveCurrency,
        coinInfo,
    );
    const symbol = cryptoIdToNetwork(networkConfigDeps, quote.receiveCurrency)?.symbol;

    if (!tradeableAsset) {
        return null;
    }

    return {
        cryptoLabel: tradeableAsset.symbol,
        cryptoNetworkSymbol: symbol,
        cryptoContractAddress: tradeableAsset.contractAddress,
        paymentMethod: quote.paymentMethod,
        countryOfResidence: quote.country,
        exchangeName: quote.exchange,
    };
};

export type GetAnalyticsTradingSellPayloadProps = {
    quote: SellFiatTrade | undefined;
    coinInfo: CoinInfo | undefined;
};

export const getAnalyticsTradingSellPayload = (
    networkConfigDeps: NetworkConfigDeps,
    { quote, coinInfo }: GetAnalyticsTradingSellPayloadProps,
) => {
    if (!coinInfo || !quote?.cryptoCurrency) {
        return null;
    }

    const tradeableAsset = coinInfoToTradeableAsset(
        networkConfigDeps,
        quote.cryptoCurrency,
        coinInfo,
    );
    const symbol = cryptoIdToNetwork(networkConfigDeps, quote.cryptoCurrency)?.symbol;

    return {
        cryptoLabel: tradeableAsset.symbol,
        cryptoNetworkSymbol: symbol,
        cryptoContractAddress: tradeableAsset.contractAddress,
        receiveMethod: quote.paymentMethod,
        countryOfResidence: quote.country,
        exchangeName: quote.exchange,
    };
};
