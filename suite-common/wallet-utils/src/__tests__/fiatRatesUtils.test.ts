import { TokenAddress } from '@suite-common/wallet-types';

import { getFiatRateKey, getFiatRateKeyFromTicker } from '../fiatRatesUtils';

describe('fiat rates utils', () => {
    it('formats fiat rate key', () => {
        expect(getFiatRateKey('eth', 'usd')).toMatch('btc-usd');
        expect(
            getFiatRateKey(
                'eth',
                'usd',
                '0x6b175474e89094c44da98b954eedeac495271d0f' as TokenAddress,
            ),
        ).toMatch('eth-0x6b175474e89094c44da98b954eedeac495271d0f-usd');
    });
    it('formats fiat rate key from ticker', () => {
        expect(getFiatRateKeyFromTicker({ symbol: 'eth' }, 'usd')).toMatch('btc-usd');
        expect(
            getFiatRateKeyFromTicker(
                {
                    symbol: 'eth',
                    tokenAddress: '0x6b175474e89094c44da98b954eedeac495271d0f' as TokenAddress,
                },
                'usd',
            ),
        ).toMatch('eth-0x6b175474e89094c44da98b954eedeac495271d0f-usd');
    });
});
