import coinsJSON from '@trezor/connect-common/files/coins.json';
import { parseCoinsJSON, getCoinInfo, getUniqueNetworks } from '../coinInfo';

describe('data/coinInfo', () => {
    beforeAll(() => {
        parseCoinsJSON(coinsJSON);
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
});
