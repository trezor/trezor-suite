import { getFiatRatesForTimestamps } from '@suite-common/fiat-services';
import { testMocks } from '@suite-common/test-utils';
import { type TokenAddress } from '@suite-common/tokens';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type RatesByTimestamps,
    type TickerResult,
    type Timestamp,
    type WalletAccountTransaction,
    asTimestamp,
} from '@suite-common/wallet-types';

import {
    fetchTransactionsRates,
    getFiatRateKey,
    getFiatRateKeyFromTicker,
    roundTimestampToNearestPastHour,
    selectHistoricRatesByTransactions,
} from './fiatRatesUtils';

jest.mock('@suite-common/fiat-services', () => ({ getFiatRatesForTimestamps: jest.fn() }));

const ethSymbol = asNetworkSymbol('eth');
const btcSymbol = asNetworkSymbol('btc');
const tokenAddress = '0x6b175474e89094c44da98b954eedeac495271d0f' as TokenAddress;

const hour = asTimestamp(1_700_000_000 - (1_700_000_000 % 3600));
const nextHour = asTimestamp(hour + 3600);

const ethUsd = getFiatRateKey(ethSymbol, 'usd');
const ethEur = getFiatRateKey(ethSymbol, 'eur');
const ethTokenUsd = getFiatRateKey(ethSymbol, 'usd', tokenAddress);
const btcUsd = getFiatRateKey(btcSymbol, 'usd');

const historicRates: RatesByTimestamps = {
    [ethUsd]: { [hour]: 2000, [nextHour]: 2100 },
    [ethEur]: { [hour]: 1800 },
    [ethTokenUsd]: { [hour]: 1 },
    [btcUsd]: { [hour]: 40_000, [nextHour]: 41_000 },
};

const tokenTransfer: WalletAccountTransaction['tokens'][number] = {
    type: 'sent',
    amount: '1',
    from: '0xfrom',
    to: '0xto',
    contract: tokenAddress,
    decimals: 18,
};

const mockTransaction = (
    symbol: WalletAccountTransaction['symbol'],
    blockTime: WalletAccountTransaction['blockTime'],
    tokens: WalletAccountTransaction['tokens'] = [],
): WalletAccountTransaction => testMocks.getWalletTransaction({ symbol, blockTime, tokens });

describe('fiat rates utils', () => {
    it('formats fiat rate key', () => {
        expect(getFiatRateKey(ethSymbol, 'usd')).toMatch('eth-usd');

        const result = getFiatRateKey(
            ethSymbol,
            'usd',
            '0x6b175474e89094c44da98b954eedeac495271d0f' as TokenAddress,
        );

        expect(result).toMatch('eth-0x6b175474e89094c44da98b954eedeac495271d0f-usd');
    });
    it('formats fiat rate key from ticker', () => {
        expect(getFiatRateKeyFromTicker({ symbol: ethSymbol }, 'usd')).toMatch('eth-usd');

        const result = getFiatRateKeyFromTicker(
            {
                symbol: ethSymbol,
                tokenAddress: '0x6b175474e89094c44da98b954eedeac495271d0f' as TokenAddress,
            },
            'usd',
        );

        expect(result).toMatch('eth-0x6b175474e89094c44da98b954eedeac495271d0f-usd');
    });
    it('rounds timestamp to the nearest past hour', () => {
        const timestamp = new Date('2024-03-19T15:45:00Z').getTime() / 1000;
        const expected = new Date('2024-03-19T15:00:00Z').getTime() / 1000;

        expect(roundTimestampToNearestPastHour(timestamp as Timestamp)).toBe(expected);
    });
});

describe(selectHistoricRatesByTransactions.name, () => {
    it('selects coin and token rates of the transaction symbol at the rounded hour', () => {
        const txs = [mockTransaction(ethSymbol, hour + 600, [tokenTransfer])];

        expect(selectHistoricRatesByTransactions(historicRates, txs)).toEqual({
            [ethUsd]: { [hour]: 2000 },
            [ethEur]: { [hour]: 1800 },
            [ethTokenUsd]: { [hour]: 1 },
        });
    });

    it('selects only coin rates for a transaction without token transfers', () => {
        const txs = [mockTransaction(ethSymbol, hour + 600)];

        expect(selectHistoricRatesByTransactions(historicRates, txs)).toEqual({
            [ethUsd]: { [hour]: 2000 },
            [ethEur]: { [hour]: 1800 },
        });
    });

    it('skips rates of tokens the transaction did not transfer', () => {
        const otherTokenTransfer = { ...tokenTransfer, contract: '0xother' };
        const txs = [mockTransaction(ethSymbol, hour + 600, [otherTokenTransfer])];

        expect(selectHistoricRatesByTransactions(historicRates, txs)).toEqual({
            [ethUsd]: { [hour]: 2000 },
            [ethEur]: { [hour]: 1800 },
        });
    });

    it('skips rates of a network whose symbol starts with the transaction symbol', () => {
        const ethwUsd = getFiatRateKey(asNetworkSymbol('ethw'), 'usd');
        const rates: RatesByTimestamps = { [ethUsd]: { [hour]: 2000 }, [ethwUsd]: { [hour]: 3 } };
        const txs = [mockTransaction(ethSymbol, hour)];

        expect(selectHistoricRatesByTransactions(rates, txs)).toEqual({
            [ethUsd]: { [hour]: 2000 },
        });
    });

    it('selects token rates of a contract that contains a dash', () => {
        const xlmSymbol = asNetworkSymbol('xlm');
        const stellarAsset = 'USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
        const xlmUsd = getFiatRateKey(xlmSymbol, 'usd');
        const xlmAssetUsd = getFiatRateKey(xlmSymbol, 'usd', stellarAsset as TokenAddress);
        const rates: RatesByTimestamps = {
            [xlmUsd]: { [hour]: 0.1 },
            [xlmAssetUsd]: { [hour]: 1 },
        };
        const txs = [
            mockTransaction(xlmSymbol, hour, [{ ...tokenTransfer, contract: stellarAsset }]),
        ];

        expect(selectHistoricRatesByTransactions(rates, txs)).toEqual({
            [xlmUsd]: { [hour]: 0.1 },
            [xlmAssetUsd]: { [hour]: 1 },
        });
    });

    it('selects rates of every symbol among the transactions', () => {
        const txs = [mockTransaction(ethSymbol, nextHour), mockTransaction(btcSymbol, hour + 1)];

        expect(selectHistoricRatesByTransactions(historicRates, txs)).toEqual({
            [ethUsd]: { [nextHour]: 2100 },
            [btcUsd]: { [hour]: 40_000 },
        });
    });

    it('merges timestamps of several transactions under one key', () => {
        const txs = [mockTransaction(btcSymbol, hour), mockTransaction(btcSymbol, nextHour + 59)];

        expect(selectHistoricRatesByTransactions(historicRates, txs)).toEqual({
            [btcUsd]: { [hour]: 40_000, [nextHour]: 41_000 },
        });
    });

    it('skips transactions without a rate at their hour', () => {
        const txs = [
            mockTransaction(ethSymbol, nextHour + 3600),
            mockTransaction(btcSymbol, undefined),
        ];

        expect(selectHistoricRatesByTransactions(historicRates, txs)).toEqual({});
    });

    it('selects nothing for no transactions', () => {
        expect(selectHistoricRatesByTransactions(historicRates, [])).toEqual({});
    });
});

describe(fetchTransactionsRates.name, () => {
    it('pairs each rate with the timestamp of its ticker when a rate is missing', async () => {
        const thirdHour = asTimestamp(nextHour + 3600);
        jest.mocked(getFiatRatesForTimestamps).mockResolvedValue({
            ts: 0,
            symbol: ethSymbol,
            tickers: [
                { ts: hour, rates: { usd: 2000 } },
                { ts: thirdHour, rates: { usd: 2200 } },
            ],
        });
        const rates: TickerResult[] = [];

        await fetchTransactionsRates(
            { symbol: ethSymbol },
            [hour + 600, nextHour + 600, thirdHour + 600].map(asTimestamp),
            'usd',
            false,
            rates,
        );

        expect(rates).toEqual([
            {
                tickerId: { symbol: ethSymbol },
                localCurrency: 'usd',
                rates: [
                    { rate: 2000, lastTickerTimestamp: hour },
                    { rate: 2200, lastTickerTimestamp: thirdHour },
                ],
            },
        ]);
    });
});
