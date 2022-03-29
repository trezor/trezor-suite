import coinsJSON from 'trezor-connect/data/coins.json';
import { parseCoinsJson, getCoinInfo, getUniqueNetworks } from '../CoinInfo';

describe('data/CoinInfo', () => {
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
        // @ts-ignore
        expect(getUniqueNetworks(inputs)).toEqual(result);
    });
});
