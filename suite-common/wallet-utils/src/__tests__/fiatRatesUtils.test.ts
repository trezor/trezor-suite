import { Timestamp, TokenAddress } from '@suite-common/wallet-types';

import {
    getFiatRateKey,
    getFiatRateKeyFromTicker,
    roundTimestampToNearestPastHour,
} from '../fiatRatesUtils';

describe('fiat rates utils', () => {
    it('formats fiat rate key', () => {
        expect(getFiatRateKey('eth', 'usd')).toMatch('eth-usd');

        const result = getFiatRateKey(
            'eth',
            'usd',
            '0x6b175474e89094c44da98b954eedeac495271d0f' as TokenAddress,
        );

        expect(result).toMatch('eth-0x6b175474e89094c44da98b954eedeac495271d0f-usd');
    });
    it('formats fiat rate key from ticker', () => {
        expect(getFiatRateKeyFromTicker({ symbol: 'eth' }, 'usd')).toMatch('eth-usd');

        const result = getFiatRateKeyFromTicker(
            {
                symbol: 'eth',
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
