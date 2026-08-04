import { type BuyTrade, type Coins, type CryptoId, type SellFiatTrade } from 'invity-api';

import coins from '../__fixtures__/coins.json';
import { type TradingRootState, initialState } from '../reducers/tradingCommonReducer';
import {
    type TradingTransaction,
    type TradingTransactionBuy,
    type TradingTransactionExchange,
    type TradingTransactionSell,
} from '../types';
import {
    TRADING_HISTORY_CSV_COLUMNS,
    type TradingHistoryCsvColumnLabels,
    buildTradingHistoryCsv,
    getTradingHistoryCsvRow,
    getTradingHistoryCsvType,
    prepareTradingHistoryCsv,
    sanitizeTradingCsvValue,
} from './tradeHistoryExportUtils';

const labels: TradingHistoryCsvColumnLabels = {
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
};

const resolvers = {
    getCoinSymbol: (cryptoId: CryptoId) =>
        (
            ({
                bitcoin: 'BTC',
                ethereum: 'ETH',
                'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'USDC',
            }) as Record<string, string>
        )[cryptoId],
    getProviderName: (name: string | undefined) =>
        name === 'btcdirect-sell' ? 'BTC Direct' : name,
};

const CSV_BOM = '﻿';

const buyTrade: TradingTransactionBuy = {
    tradeType: 'buy',
    date: '2025-04-10T20:21:25.042Z',
    key: 'buy-key',
    data: {
        orderId: 'buy-order',
        exchange: 'mercuryo',
        fiatCurrency: 'USD',
        fiatStringAmount: '1234',
        receiveCurrency: 'ethereum' as CryptoId,
        receiveStringAmount: '0.462586',
        receiveTxHash: 'buy-receive-hash',
        paymentId: 'buy-payment',
        status: 'SUCCESS',
    } as BuyTrade,
    receiveAccountKey: undefined,
    selectedAccountKey: undefined,
};

const sellTrade: TradingTransactionSell = {
    tradeType: 'sell',
    date: '2025-01-01T20:12:25.042Z',
    key: 'sell-key',
    data: {
        orderId: 'sell-order',
        exchange: 'btcdirect-sell',
        cryptoCurrency: 'bitcoin' as CryptoId,
        cryptoStringAmount: '1.22',
        fiatCurrency: 'USD',
        fiatStringAmount: '100',
        txid: 'sell-send-hash',
        paymentId: 'sell-payment',
        status: 'SUCCESS',
    } as SellFiatTrade,
    sendAccountKey: undefined,
};

const exchangeTrade: TradingTransactionExchange = {
    tradeType: 'exchange',
    date: '2025-02-12T20:11:03.042Z',
    key: 'exchange-key',
    data: {
        orderId: 'exchange-order',
        exchange: 'changelly',
        send: 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as CryptoId,
        sendStringAmount: '10.1232',
        receive: 'bitcoin' as CryptoId,
        receiveStringAmount: '0.462586',
        receiveTxHash: 'exchange-receive-hash',
        status: 'SUCCESS',
    },
    sendAccountKey: undefined,
    receiveAccountKey: undefined,
};

describe('tradeHistoryExportUtils', () => {
    describe('sanitizeTradingCsvValue', () => {
        it('returns plain values unchanged', () => {
            expect(sanitizeTradingCsvValue('abc')).toBe('abc');
        });

        it('wraps values containing the separator', () => {
            expect(sanitizeTradingCsvValue('a,b')).toBe('"a,b"');
        });

        it('escapes and wraps values containing quotes', () => {
            expect(sanitizeTradingCsvValue('a"b')).toBe('"a""b"');
        });

        it('wraps values containing newlines', () => {
            expect(sanitizeTradingCsvValue('a\nb')).toBe('"a\nb"');
        });

        it('neutralizes formula-injection prefixes', () => {
            expect(sanitizeTradingCsvValue('=cmd')).toBe("'=cmd");
            expect(sanitizeTradingCsvValue('@SUM(1)')).toBe("'@SUM(1)");
        });

        it('neutralizes and wraps a formula prefix that also contains a separator', () => {
            expect(sanitizeTradingCsvValue('=a,b')).toBe('"\'=a,b"');
        });
    });

    describe('getTradingHistoryCsvType', () => {
        it.each([
            ['buy', 'buy'],
            ['sell', 'sell'],
            ['exchange', 'swap'],
        ] as const)('maps %s to %s', (tradeType, expected) => {
            expect(getTradingHistoryCsvType(tradeType)).toBe(expected);
        });
    });

    describe('getTradingHistoryCsvRow', () => {
        it('maps a buy trade (fiat spent, crypto received, no spend tx)', () => {
            expect(getTradingHistoryCsvRow(buyTrade, resolvers)).toEqual({
                orderId: 'buy-order',
                date: '2025-04-10T20:21:25.042Z',
                type: 'buy',
                spentAmount: '1234',
                spendTicker: 'USD',
                spendNetwork: '',
                spendTransactionId: '',
                receiveAmount: '0.462586',
                receiveTicker: 'ETH',
                receiveNetwork: 'Ethereum',
                provider: 'mercuryo',
                status: 'SUCCESS',
                receiveTransactionId: 'buy-receive-hash',
                paymentId: 'buy-payment',
            });
        });

        it('maps a sell trade (crypto spent, fiat received, no receive tx)', () => {
            expect(getTradingHistoryCsvRow(sellTrade, resolvers)).toEqual({
                orderId: 'sell-order',
                date: '2025-01-01T20:12:25.042Z',
                type: 'sell',
                spentAmount: '1.22',
                spendTicker: 'BTC',
                spendNetwork: 'Bitcoin',
                spendTransactionId: 'sell-send-hash',
                receiveAmount: '100',
                receiveTicker: 'USD',
                receiveNetwork: '',
                provider: 'BTC Direct',
                status: 'SUCCESS',
                receiveTransactionId: '',
                paymentId: 'sell-payment',
            });
        });

        it('maps an exchange trade to swap (crypto-to-crypto, no payment id)', () => {
            expect(getTradingHistoryCsvRow(exchangeTrade, resolvers)).toEqual({
                orderId: 'exchange-order',
                date: '2025-02-12T20:11:03.042Z',
                type: 'swap',
                spentAmount: '10.1232',
                spendTicker: 'USDC',
                spendNetwork: 'Ethereum',
                spendTransactionId: '',
                receiveAmount: '0.462586',
                receiveTicker: 'BTC',
                receiveNetwork: 'Bitcoin',
                provider: 'changelly',
                status: 'SUCCESS',
                receiveTransactionId: 'exchange-receive-hash',
                paymentId: '',
            });
        });

        it('falls back to the raw crypto id when the ticker cannot be resolved', () => {
            const trade: TradingTransactionExchange = {
                ...exchangeTrade,
                data: { ...exchangeTrade.data, send: 'unknown-coin' as CryptoId },
            };

            expect(getTradingHistoryCsvRow(trade, resolvers).spendTicker).toBe('unknown-coin');
        });

        it('uses empty strings for missing optional values', () => {
            const trade: TradingTransactionExchange = {
                tradeType: 'exchange',
                date: '2025-02-12T20:11:03.042Z',
                key: 'exchange-key',
                data: {
                    orderId: 'only-order',
                    sendStringAmount: undefined,
                    receiveStringAmount: undefined,
                },
                sendAccountKey: undefined,
                receiveAccountKey: undefined,
            };

            expect(getTradingHistoryCsvRow(trade, resolvers)).toEqual({
                orderId: 'only-order',
                date: '2025-02-12T20:11:03.042Z',
                type: 'swap',
                spentAmount: '',
                spendTicker: '',
                spendNetwork: '',
                spendTransactionId: '',
                receiveAmount: '',
                receiveTicker: '',
                receiveNetwork: '',
                provider: '',
                status: '',
                receiveTransactionId: '',
                paymentId: '',
            });
        });
    });

    describe('buildTradingHistoryCsv', () => {
        const header = TRADING_HISTORY_CSV_COLUMNS.map(column => labels[column]).join(',');

        it('returns only the header for an empty trade list', () => {
            expect(buildTradingHistoryCsv(labels)([], resolvers)).toBe(CSV_BOM + header);
        });

        it('builds a header plus one line per trade', () => {
            const trades: TradingTransaction[] = [buyTrade, sellTrade, exchangeTrade];
            const csv = buildTradingHistoryCsv(labels)(trades, resolvers);
            const lines = csv.split('\n');

            expect(lines).toHaveLength(4);
            expect(lines[0]).toBe(CSV_BOM + header);
            expect(lines[1]).toBe(
                'buy-order,2025-04-10T20:21:25.042Z,buy,1234,USD,,,0.462586,ETH,Ethereum,mercuryo,SUCCESS,buy-receive-hash,buy-payment',
            );
        });

        it('uses the injected translated labels for the header row', () => {
            const czLabels = Object.fromEntries(
                TRADING_HISTORY_CSV_COLUMNS.map(column => [column, `cs:${column}`]),
            ) as TradingHistoryCsvColumnLabels;

            const [headerRow] = buildTradingHistoryCsv(czLabels)([], resolvers).split('\n');

            expect(headerRow).toBe(
                CSV_BOM + TRADING_HISTORY_CSV_COLUMNS.map(column => `cs:${column}`).join(','),
            );
        });

        it('sanitizes values that contain the separator', () => {
            const trade: TradingTransactionBuy = {
                ...buyTrade,
                data: { ...buyTrade.data, orderId: 'a,b' } as BuyTrade,
            };
            const csv = buildTradingHistoryCsv(labels)([trade], resolvers);
            const [, row] = csv.split('\n');

            expect(row?.startsWith('"a,b",')).toBe(true);
        });
    });

    describe('prepareTradingHistoryCsv', () => {
        const state: TradingRootState = {
            wallet: {
                trading: {
                    ...initialState,
                    info: { ...initialState.info, coins: coins as unknown as Coins },
                },
            },
        };

        it('resolves coin tickers from state and falls back to the raw provider name', () => {
            const csv = prepareTradingHistoryCsv(labels)(state, [sellTrade]);
            const [, row] = csv.split('\n');

            // BTC ticker resolved from state coins, provider name falls back to the raw exchange id.
            expect(row).toBe(
                'sell-order,2025-01-01T20:12:25.042Z,sell,1.22,BTC,Bitcoin,sell-send-hash,100,USD,,btcdirect-sell,SUCCESS,,sell-payment',
            );
        });
    });
});
