import type { CryptoId } from 'invity-api';

import { exhaustive } from '@trezor/type-utils';

import type { TradingTradeType } from '../types';
import { isBuyTrade, isExchangeTrade, isSellFiatTrade } from '../utils';

type UndefinedTradeOperation = {
    fromValue: undefined;
    fromCurrency: undefined;
    toValue: undefined;
    toCurrency: undefined;
    isFromCrypto: undefined;
    isToCrypto: undefined;
};

type FiatToCryptoOperation = {
    fromValue: string | undefined;
    fromCurrency: string | undefined;
    toValue: string | undefined;
    toCurrency: CryptoId | undefined;
    isFromCrypto: false;
    isToCrypto: true;
};

type CryptoToFiatOperation = {
    fromValue: string | undefined;
    fromCurrency: CryptoId | undefined;
    toValue: string | undefined;
    toCurrency: string | undefined;
    isFromCrypto: true;
    isToCrypto: false;
};

type CryptoToCryptoOperation = {
    fromValue: string | undefined;
    fromCurrency: CryptoId | undefined;
    toValue: string | undefined;
    toCurrency: CryptoId | undefined;
    isFromCrypto: true;
    isToCrypto: true;
};

export type TradeOperationData =
    | UndefinedTradeOperation
    | FiatToCryptoOperation
    | CryptoToFiatOperation
    | CryptoToCryptoOperation;

export const getTradeOperationData = (trade: TradingTradeType | undefined): TradeOperationData => {
    if (!trade) {
        return {
            fromValue: undefined,
            fromCurrency: undefined,
            toValue: undefined,
            toCurrency: undefined,
            isFromCrypto: undefined,
            isToCrypto: undefined,
        };
    }

    if (isBuyTrade(trade)) {
        return {
            fromValue: trade.fiatStringAmount,
            fromCurrency: trade.fiatCurrency,
            toValue: trade.receiveStringAmount,
            toCurrency: trade.receiveCurrency,
            isFromCrypto: false,
            isToCrypto: true,
        };
    }

    if (isSellFiatTrade(trade)) {
        return {
            fromValue: trade.cryptoStringAmount,
            fromCurrency: trade.cryptoCurrency,
            toValue: trade.fiatStringAmount,
            toCurrency: trade.fiatCurrency,
            isFromCrypto: true,
            isToCrypto: false,
        };
    }

    if (isExchangeTrade(trade)) {
        return {
            fromValue: trade.sendStringAmount,
            fromCurrency: trade.send,
            toValue: trade.receiveStringAmount,
            toCurrency: trade.receive,
            isFromCrypto: true,
            isToCrypto: true,
        };
    }

    return exhaustive(trade);
};
