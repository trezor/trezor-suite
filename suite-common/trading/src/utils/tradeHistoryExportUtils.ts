import { type CryptoId } from 'invity-api';

import { typedObjectKeys } from '@trezor/utils';

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

/**
 * Escape a single CSV value: neutralize formula-injection prefixes and wrap/escape
 * values that contain the separator, quotes, or newlines.
 */
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

/** CSV column keys mapped to their human-readable header labels. */
export const TRADING_HISTORY_CSV_FIELDS = {
    orderId: 'Trade ID',
    date: 'Date and time',
    type: 'Type',
    spentAmount: 'Spent amount',
    spendTicker: 'Spend ticker',
    spendNetwork: 'Spend network',
    spendTransactionId: 'Spend transaction ID',
    receiveAmount: 'Receive amount',
    receiveTicker: 'Receive ticker',
    receiveNetwork: 'Receive network',
    provider: 'Provider',
    status: 'Status',
    receiveTransactionId: 'Receive transaction ID',
    paymentId: 'Payment ID',
} as const;

type TradingHistoryCsvField = keyof typeof TRADING_HISTORY_CSV_FIELDS;

export type TradingHistoryCsvRow = Record<TradingHistoryCsvField, string>;

type TradingHistoryCsvResolvers = {
    getCoinSymbol: (cryptoId: CryptoId) => string | undefined;
    getProviderName: (name: string | undefined, tradeType: TradingType) => string | undefined;
};

/** The `Type` column uses `swap` instead of `exchange` (per export spec). */
export const getTradingHistoryCsvType = (tradeType: TradingType): string =>
    tradeType === 'exchange' ? 'swap' : tradeType;

/**
 * Map a single trade to a flat, human-readable CSV row. Buy/sell/exchange trades are normalized
 * into a common `spend`/`receive` shape so a single set of columns fits all trade types.
 */
export const getTradingHistoryCsvRow = (
    trade: TradingTransaction,
    { getCoinSymbol, getProviderName }: TradingHistoryCsvResolvers,
): TradingHistoryCsvRow => {
    const { tradeType, data } = trade;
    const { fromValue, fromCurrency, toValue, toCurrency, isFromCrypto, isToCrypto } =
        getTradeOperationData(data);

    // For crypto use the resolved ticker (e.g. BTC, ETH), for fiat the currency code is the ticker.
    const resolveTicker = (
        currency: string | CryptoId | undefined,
        isCrypto: boolean | undefined,
    ) => {
        if (!currency) {
            return '';
        }

        return isCrypto ? (getCoinSymbol(currency as CryptoId) ?? currency) : currency;
    };

    // Networks only exist for crypto; fiat legs leave the network column empty.
    const resolveNetwork = (
        currency: string | CryptoId | undefined,
        isCrypto: boolean | undefined,
    ) => (isCrypto && currency ? (cryptoIdToNetwork(currency as CryptoId)?.name ?? '') : '');

    // `txid` of the crypto the user sent. Only sell trades expose it; empty for buy (fiat in) and exchange.
    const spendTransactionId = isSellFiatTrade(data) ? (data.txid ?? '') : '';
    // `receiveTxHash` of the crypto sent to the user. Present for buy and exchange; empty for sell (fiat out).
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

/**
 * Build a CSV document (header + one line per trade) from the given trades. The provider name and
 * coin ticker resolution is injected so this stays platform-agnostic and easy to test.
 */
export const buildTradingHistoryCsv = (
    trades: TradingTransaction[],
    resolvers: TradingHistoryCsvResolvers,
): string => {
    const fieldKeys = typedObjectKeys(TRADING_HISTORY_CSV_FIELDS);

    const header = fieldKeys
        .map(key => sanitizeTradingCsvValue(TRADING_HISTORY_CSV_FIELDS[key]))
        .join(CSV_SEPARATOR);

    const rows = trades.map(trade => {
        const row = getTradingHistoryCsvRow(trade, resolvers);

        return fieldKeys.map(key => sanitizeTradingCsvValue(row[key])).join(CSV_SEPARATOR);
    });

    return [header, ...rows].join(CSV_NEWLINE);
};

/**
 * Prepare the trade history CSV string. Reusable across the mobile and desktop apps as both compose
 * the shared `@suite-common/trading` state.
 */
export const prepareTradingHistoryCsv = (
    state: TradingRootState,
    trades: TradingTransaction[],
): string =>
    buildTradingHistoryCsv(trades, {
        getCoinSymbol: cryptoId => selectTradingCoinSymbolByCryptoId(state, cryptoId),
        getProviderName: (name, tradeType) =>
            selectTradingProviderCompanyName(state, name, tradeType),
    });
