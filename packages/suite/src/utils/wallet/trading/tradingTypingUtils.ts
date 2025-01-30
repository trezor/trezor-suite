import { BuyTrade, ExchangeTrade, SellFiatTrade } from 'invity-api';

import type {
    TradingBuyType,
    TradingExchangeType,
    TradingSellType,
    TradingTradeType,
    TradingType,
} from '@suite-common/trading';
import { CurrencyOption } from '@suite-common/wallet-types';

import { FORM_FIAT_CURRENCY_SELECT, FORM_OUTPUT_CURRENCY } from 'src/constants/wallet/trading/form';
import {
    TradingCryptoListProps,
    TradingGetCryptoQuoteAmountProps,
    TradingGetFiatCurrenciesProps,
    TradingGetPaymentMethodProps,
    TradingGetProvidersInfoProps,
    TradingTradeDetailMapProps,
} from 'src/types/trading/trading';
import { TradingFormContextValues, TradingFormMapProps } from 'src/types/trading/tradingForm';

export const isTradingBuyContext = (
    context: TradingFormMapProps[keyof TradingFormMapProps],
): context is TradingFormMapProps[TradingBuyType] => context.type === 'buy';

export const isTradingSellContext = (
    context: TradingFormMapProps[keyof TradingFormMapProps],
): context is TradingFormMapProps[TradingSellType] => context.type === 'sell';

export const isTradingExchangeContext = (
    context: TradingFormMapProps[keyof TradingFormMapProps],
): context is TradingFormMapProps[TradingExchangeType] => context.type === 'exchange';

export const getCryptoQuoteAmountProps = (
    quoteInput: TradingTradeType | undefined,
    context: TradingFormContextValues<TradingType>,
): TradingGetCryptoQuoteAmountProps | null => {
    if (!quoteInput) return null;

    if (isTradingBuyContext(context)) {
        const amountInCrypto = context.quotesRequest?.wantCrypto;
        const quote = quoteInput as BuyTrade;

        if (!quote || !context.quotesRequest) return null;

        return {
            amountInCrypto,
            sendAmount: quote?.fiatStringAmount ?? '',
            sendCurrency: quote?.fiatCurrency,
            receiveAmount: quote?.receiveStringAmount ?? '',
            receiveCurrency: quote?.receiveCurrency,
        };
    }

    if (isTradingSellContext(context)) {
        const amountInCrypto = context.quotesRequest?.amountInCrypto;
        const quote = quoteInput as SellFiatTrade;

        if (!quote || !context.quotesRequest) return null;

        return {
            amountInCrypto,
            sendAmount: quote?.fiatStringAmount ?? '',
            sendCurrency: quote?.fiatCurrency,
            receiveAmount: quote?.cryptoStringAmount ?? '',
            receiveCurrency: quote?.cryptoCurrency,
        };
    }

    const quote = quoteInput as ExchangeTrade;

    return {
        amountInCrypto: false,
        sendAmount: quote?.sendStringAmount ?? '',
        sendCurrency: quote?.send,
        receiveAmount: quote?.receiveStringAmount ?? '',
        receiveCurrency: quote?.receive,
    };
};

export const getProvidersInfoProps = (
    context: TradingFormContextValues<TradingType>,
): TradingGetProvidersInfoProps => {
    if (isTradingBuyContext(context)) {
        return context.buyInfo?.providerInfos;
    }

    if (isTradingSellContext(context)) {
        return context.sellInfo?.providerInfos;
    }

    return context.exchangeInfo?.providerInfos;
};

export const getFiatCurrenciesProps = (
    context: TradingFormContextValues<TradingType>,
): TradingGetFiatCurrenciesProps | null => {
    if (isTradingBuyContext(context)) {
        return {
            supportedFiatCurrencies: context.buyInfo?.supportedFiatCurrencies,
            defaultAmountsOfFiatCurrencies: context.buyInfo?.buyInfo.defaultAmountsOfFiatCurrencies,
        };
    }

    if (isTradingSellContext(context)) {
        return {
            supportedFiatCurrencies: context.sellInfo?.supportedFiatCurrencies,
        };
    }

    return null;
};

export const getSelectQuoteTyped = (
    context: TradingFormContextValues<TradingType>,
): ((quote: TradingTradeDetailMapProps[typeof context.type]) => void) => {
    const selectQuote = context.selectQuote as (
        quote: TradingTradeDetailMapProps[typeof context.type],
    ) => void;

    return selectQuote;
};

export const getSelectedCrypto = (
    context: TradingFormContextValues<TradingType>,
): TradingCryptoListProps | null | undefined => {
    if (isTradingExchangeContext(context)) {
        return context.getValues().receiveCryptoSelect;
    }

    if (isTradingSellContext(context)) {
        return context.getValues().sendCryptoSelect;
    }

    return context.getValues().cryptoSelect;
};

export const getSelectedCurrency = (
    context: TradingFormContextValues<TradingType>,
): CurrencyOption => {
    if (isTradingExchangeContext(context)) {
        return context.getValues(FORM_OUTPUT_CURRENCY);
    }

    if (isTradingSellContext(context)) {
        return context.getValues(FORM_OUTPUT_CURRENCY);
    }

    return context.getValues(FORM_FIAT_CURRENCY_SELECT);
};

export const getPaymentMethod = (
    selectedQuote: SellFiatTrade | ExchangeTrade | BuyTrade,
    context: TradingFormContextValues<TradingType>,
): TradingGetPaymentMethodProps => {
    if (isTradingExchangeContext(context)) return {};

    const selectedQuoteTyped = selectedQuote as SellFiatTrade | BuyTrade;

    return {
        paymentMethod: selectedQuoteTyped.paymentMethod,
        paymentMethodName: selectedQuoteTyped.paymentMethodName,
    };
};
