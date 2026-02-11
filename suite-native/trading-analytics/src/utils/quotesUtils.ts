import type { CoinInfo, SellFiatTrade } from 'invity-api';

import { cryptoIdToNetwork } from '@suite-common/trading';
import { coinInfoToTradeableAsset } from '@suite-native/trading-atoms';

export type GetAnalyticsTradingSellPayloadProps = {
    quote: SellFiatTrade | undefined;
    coinInfo: CoinInfo | undefined;
};

export const getAnalyticsTradingSellPayload = ({
    quote,
    coinInfo,
}: GetAnalyticsTradingSellPayloadProps) => {
    if (!coinInfo || !quote?.cryptoCurrency) {
        return null;
    }

    const tradeableAsset = coinInfoToTradeableAsset(quote.cryptoCurrency, coinInfo);
    const symbol = cryptoIdToNetwork(quote.cryptoCurrency)?.symbol;

    return {
        cryptoLabel: tradeableAsset.symbol,
        cryptoNetworkSymbol: symbol,
        cryptoContractAddress: tradeableAsset.contractAddress,
        receiveMethod: quote.paymentMethod,
        countryOfResidence: quote.country,
        exchangeName: quote.exchange,
    };
};
