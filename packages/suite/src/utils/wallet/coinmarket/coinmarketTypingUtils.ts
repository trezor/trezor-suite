import {
    isCoinmarketBuyOffers,
    isCoinmarketSellOffers,
} from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import { CoinmarketTradeType } from 'src/types/coinmarket/coinmarket';
import { CoinmarketOffersContextValues } from 'src/types/coinmarket/coinmarketOffers';

export const getCryptoAmountProps = (
    context: CoinmarketOffersContextValues<CoinmarketTradeType>,
) => {
    if (isCoinmarketBuyOffers(context)) {
        const wantCrypto = context.quotesRequest?.wantCrypto;
        const quote = context.quotes?.[0];

        return {
            wantCrypto,
            fiatAmount: !wantCrypto ? quote?.fiatStringAmount : '',
            fiatCurrency: quote?.fiatCurrency,
            cryptoAmount: wantCrypto ? quote?.receiveStringAmount : '',
            cryptoCurrency: quote?.receiveCurrency,
        };
    } else if (isCoinmarketSellOffers(context)) {
        const amountInCrypto = context.quotesRequest?.amountInCrypto;
        const quote = context.quotes?.[0];

        return {
            wantCrypto: amountInCrypto,
            fiatAmount: !amountInCrypto ? quote?.fiatStringAmount : '',
            fiatCurrency: quote?.fiatCurrency,
            cryptoAmount: amountInCrypto ? quote?.cryptoStringAmount : '',
            cryptoCurrency: quote?.cryptoCurrency,
        };
    }

    return {
        wantCrypto: undefined,
        fiatAmount: '',
        fiatCurrency: '',
        cryptoAmount: '',
        cryptoCurrency: undefined,
    };
};

export const getProvidersInfoProps = (
    context: CoinmarketOffersContextValues<CoinmarketTradeType>,
) => {
    if (isCoinmarketBuyOffers(context)) {
        return {
            providers: context.providersInfo,
        };
    } else if (isCoinmarketSellOffers(context)) {
        return {
            providers: context.sellInfo?.providerInfos,
        };
    }

    return {
        providers: context.exchangeInfo?.providerInfos,
    };
};
