import { type CryptoId } from 'invity-api';

import { type TradingRootState } from '../reducers/tradingCommonReducer';
import {
    selectTradingCoinSymbolByCryptoId,
    selectTradingProviderCompanyName,
} from '../selectors/tradingSelectors';
import { type TradingTransaction, type TradingType } from '../types';
import { cryptoIdToNetwork, isBuyTrade, isExchangeTrade, isSellFiatTrade } from '../utils';
import { getTradeOperationData } from './tradeOperationUtils';

const CSV_NEWLINE = '\n';
const CSV_SEPARATOR = ',';
const CSV_LEADING_CHARACTERS_TO_ESCAPE_REGEX = /^[\s\uFEFF]*[=+\-@＝＋－＠]/u;
const CSV_BOM = '\uFEFF';

export const sanitizeTradingCsvValue = (value: string): string => {
    const sanitizedValue = CSV_LEADING_CHARACTERS_TO_ESCAPE_REGEX.test(value) ? `'${value}` : value;

    if (
        sanitizedValue.includes(CSV_SEPARATOR) ||
        sanitizedValue.includes('"') ||
        sanitizedValue.includes('\n') ||
        sanitizedValue.includes('\r')
    ) {
        return `"${sanitizedValue.replace(/"/g, '""')}"`;
    }

    return sanitizedValue;
};

export const TRADING_HISTORY_CSV_COLUMNS = [
    'orderId',
    'date',
    'type',
    'spentAmount',
    'spendTicker',
    'spendNetwork',
    'spendTransactionId',
    'receiveAmount',
    'receiveTicker',
    'receiveNetwork',
    'provider',
    'status',
    'receiveTransactionId',
    'paymentId',
] as const;

export type TradingHistoryCsvColumn = (typeof TRADING_HISTORY_CSV_COLUMNS)[number];
export type TradingHistoryCsvColumnLabels = Record<TradingHistoryCsvColumn, string>;
export type TradingHistoryCsvRow = Record<TradingHistoryCsvColumn, string>;

type TradingHistoryCsvResolvers = {
    getCoinSymbol: (cryptoId: CryptoId) => string | undefined;
    getProviderName: (name: string | undefined, tradeType: TradingType) => string | undefined;
};

export const getTradingHistoryCsvType = (tradeType: TradingType): string =>
    tradeType === 'exchange' ? 'swap' : tradeType;

export const getTradingHistoryCsvRow = (
    trade: TradingTransaction,
    { getCoinSymbol, getProviderName }: TradingHistoryCsvResolvers,
): TradingHistoryCsvRow => {
    const { tradeType, data } = trade;
    const { fromValue, fromCurrency, toValue, toCurrency, isFromCrypto, isToCrypto } =
        getTradeOperationData(data);

    const resolveTicker = (
        currency: string | CryptoId | undefined,
        isCrypto: boolean | undefined,
    ) => {
        if (!currency) {
            return '';
        }

        return isCrypto ? (getCoinSymbol(currency as CryptoId) ?? currency) : currency;
    };

    const resolveNetwork = (
        currency: string | CryptoId | undefined,
        isCrypto: boolean | undefined,
    ) => (isCrypto && currency ? (cryptoIdToNetwork(currency as CryptoId)?.name ?? '') : '');

    const spendTransactionId = isSellFiatTrade(data) ? (data.txid ?? '') : '';
    const receiveTransactionId =
        isBuyTrade(data) || isExchangeTrade(data) ? (data.receiveTxHash ?? '') : '';

    return {
        orderId: data.orderId ?? '',
        date: trade.date ?? '',
        type: getTradingHistoryCsvType(tradeType),
        spentAmount: fromValue ?? '',
        spendTicker: resolveTicker(fromCurrency, isFromCrypto),
        spendNetwork: resolveNetwork(fromCurrency, isFromCrypto),
        spendTransactionId,
        receiveAmount: toValue ?? '',
        receiveTicker: resolveTicker(toCurrency, isToCrypto),
        receiveNetwork: resolveNetwork(toCurrency, isToCrypto),
        provider: getProviderName(data.exchange, tradeType) ?? '',
        status: data.status ?? '',
        receiveTransactionId,
        paymentId: 'paymentId' in data ? (data.paymentId ?? '') : '',
    };
};

export const buildTradingHistoryCsv =
    (labels: TradingHistoryCsvColumnLabels) =>
    (trades: TradingTransaction[], resolvers: TradingHistoryCsvResolvers): string => {
        const header = TRADING_HISTORY_CSV_COLUMNS.map(column =>
            sanitizeTradingCsvValue(labels[column]),
        ).join(CSV_SEPARATOR);

        const rows = trades.map(trade => {
            const row = getTradingHistoryCsvRow(trade, resolvers);

            return TRADING_HISTORY_CSV_COLUMNS.map(column =>
                sanitizeTradingCsvValue(row[column]),
            ).join(CSV_SEPARATOR);
        });

        return CSV_BOM + [header, ...rows].join(CSV_NEWLINE);
    };

export const prepareTradingHistoryCsv =
    (labels: TradingHistoryCsvColumnLabels) =>
    (state: TradingRootState, trades: TradingTransaction[]): string =>
        buildTradingHistoryCsv(labels)(trades, {
            getCoinSymbol: cryptoId => selectTradingCoinSymbolByCryptoId(state, cryptoId),
            getProviderName: (name, tradeType) =>
                selectTradingProviderCompanyName(state, name, tradeType),
        });
