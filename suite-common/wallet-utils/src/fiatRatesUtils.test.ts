import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type RatesByTimestamps,
    type Timestamp,
    type TokenAddress,
    type WalletAccountTransaction,
} from '@suite-common/wallet-types';

import {
    getFiatRateKey,
    getFiatRateKeyFromTicker,
    roundTimestampToNearestPastHour,
    selectHistoricRatesByTransactions,
} from './fiatRatesUtils';

const ethSymbol = asNetworkSymbol('eth');

const DAI = '0x6b175474e89094c44da98b954eedeac495271d0f' as TokenAddress;
const USDT = '0xdac17f958d2ee523a2206206994597c13d831ec7' as TokenAddress;
// Stellar classic assets are identified by `CODE-ISSUER`, so the contract itself contains a dash.
const STELLAR_USDC =
    'USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN' as TokenAddress;
const STELLAR_EURC =
    'EURC-GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2' as TokenAddress;

describe('fiat rates utils', () => {
    it('formats fiat rate key', () => {
        expect(getFiatRateKey(ethSymbol, 'usd')).toMatch('eth-usd');

        const result = getFiatRateKey(ethSymbol, 'usd', DAI);

        expect(result).toMatch(`eth-${DAI}-usd`);
    });
    it('formats fiat rate key from ticker', () => {
        expect(getFiatRateKeyFromTicker({ symbol: ethSymbol }, 'usd')).toMatch('eth-usd');

        const result = getFiatRateKeyFromTicker({ symbol: ethSymbol, tokenAddress: DAI }, 'usd');

        expect(result).toMatch(`eth-${DAI}-usd`);
    });
    it('rounds timestamp to the nearest past hour', () => {
        const timestamp = new Date('2024-03-19T15:45:00Z').getTime() / 1000;
        const expected = new Date('2024-03-19T15:00:00Z').getTime() / 1000;

        expect(roundTimestampToNearestPastHour(timestamp as Timestamp)).toBe(expected);
    });
});

// Historic rates are keyed by the block time rounded down to the whole hour.
const HOUR = 1700002800;
const NEXT_HOUR = HOUR + 3600;

const transaction = ({
    symbol = 'eth',
    blockTime = HOUR,
    contracts = [] as TokenAddress[],
} = {}): WalletAccountTransaction =>
    ({
        symbol,
        blockTime,
        tokens: contracts.map(contract => ({ contract })),
    }) as unknown as WalletAccountTransaction;

const rates = (entries: Record<string, Record<number, number>>) => entries as RatesByTimestamps;

describe('selectHistoricRatesByTransactions', () => {
    it('keeps only the token rates a transaction actually moves', () => {
        const result = selectHistoricRatesByTransactions(
            rates({
                'eth-usd': { [HOUR]: 3000 },
                [getFiatRateKey(ethSymbol, 'usd', DAI)]: { [HOUR]: 1 },
                [getFiatRateKey(ethSymbol, 'usd', USDT)]: { [HOUR]: 1 },
            }),
            [transaction({ contracts: [DAI] })],
        );

        expect(result).toEqual({
            'eth-usd': { [HOUR]: 3000 },
            [getFiatRateKey(ethSymbol, 'usd', DAI)]: { [HOUR]: 1 },
        });
    });

    it('keeps a coin rate for a transaction without tokens', () => {
        const result = selectHistoricRatesByTransactions(
            rates({
                'eth-usd': { [HOUR]: 3000 },
                [getFiatRateKey(ethSymbol, 'usd', DAI)]: { [HOUR]: 1 },
            }),
            [transaction()],
        );

        expect(result).toEqual({ 'eth-usd': { [HOUR]: 3000 } });
    });

    it('keeps rates across every base currency the transaction was priced in', () => {
        const result = selectHistoricRatesByTransactions(
            rates({ 'eth-usd': { [HOUR]: 3000 }, 'eth-eur': { [HOUR]: 2800 } }),
            [transaction()],
        );

        expect(result).toEqual({ 'eth-usd': { [HOUR]: 3000 }, 'eth-eur': { [HOUR]: 2800 } });
    });

    it('drops rates of another network and of unreferenced timestamps', () => {
        const result = selectHistoricRatesByTransactions(
            rates({
                'eth-usd': { [HOUR]: 3000, [NEXT_HOUR]: 3100 },
                'btc-usd': { [HOUR]: 50000 },
            }),
            [transaction()],
        );

        expect(result).toEqual({ 'eth-usd': { [HOUR]: 3000 } });
    });

    it('matches a stellar token whose contract contains a dash', () => {
        const result = selectHistoricRatesByTransactions(
            rates({
                'xlm-usd': { [HOUR]: 0.1 },
                [getFiatRateKey(asNetworkSymbol('xlm'), 'usd', STELLAR_USDC)]: { [HOUR]: 1 },
                [getFiatRateKey(asNetworkSymbol('xlm'), 'usd', STELLAR_EURC)]: { [HOUR]: 1.1 },
            }),
            [transaction({ symbol: 'xlm', contracts: [STELLAR_USDC] })],
        );

        expect(result).toEqual({
            'xlm-usd': { [HOUR]: 0.1 },
            [getFiatRateKey(asNetworkSymbol('xlm'), 'usd', STELLAR_USDC)]: { [HOUR]: 1 },
        });
    });

    it('does not confuse a network with one whose symbol it prefixes', () => {
        const result = selectHistoricRatesByTransactions(
            rates({ 'eth-usd': { [HOUR]: 3000 }, 'ethw-usd': { [HOUR]: 4 } }),
            [transaction()],
        );

        expect(result).toEqual({ 'eth-usd': { [HOUR]: 3000 } });
    });
});
