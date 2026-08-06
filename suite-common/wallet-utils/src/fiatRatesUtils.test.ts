import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Timestamp, type TokenAddress } from '@suite-common/wallet-types';

import {
    getFiatRateKey,
    getFiatRateKeyFromTicker,
    roundTimestampToNearestPastHour,
} from './fiatRatesUtils';

const ethSymbol = asNetworkSymbol('eth');

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
