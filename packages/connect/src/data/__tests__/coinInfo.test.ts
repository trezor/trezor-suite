import coinsJSON from '@trezor/connect-common/files/coins.json';
import { parseCoinsJson, getCoinInfo, getUniqueNetworks, getAllNetworks } from '../coinInfo';

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
            expect(network.blocktime).toBeGreaterThan(0);
        });
    });
});
