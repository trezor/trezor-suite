import coinsJSON from '@trezor/connect-common/files/coins.json';

import { getAllNetworks, getCoinInfo, getUniqueNetworks, parseCoinsJson } from '../coinInfo';

describe('data/coinInfo', () => {
    beforeAll(() => {
        parseCoinsJson(coinsJSON);
    });

    it('getUniqueNetworks', () => {
        const inputs = [
            getCoinInfo('btc'),
            getCoinInfo('ltc'),
            getCoinInfo('btc'),
            getCoinInfo('ltc'),
            getCoinInfo('ltc'),
        ];
        const result = [getCoinInfo('btc'), getCoinInfo('ltc')];
        expect(getUniqueNetworks(inputs)).toEqual(result);
    });

    it('bitcoin network blocktime', () => {
        const bitcoinNetworks = getAllNetworks().filter(({ type }) => type === 'bitcoin');
        bitcoinNetworks.forEach(network => {
            expect(network.blockTime).toBeGreaterThan(0);
        });
    });
});
