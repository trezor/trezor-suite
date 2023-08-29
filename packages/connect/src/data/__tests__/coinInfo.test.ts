import coinsJSON from '@trezor/connect-common/files/coins.json';
import blockchainLinkJSON from '@trezor/connect-common/files/blockchain-link.json';
import { parseCoinsJson, getCoinInfo, getUniqueNetworks, getAllNetworks } from '../coinInfo';

describe('data/coinInfo', () => {
    beforeAll(() => {
        parseCoinsJson(coinsJSON, blockchainLinkJSON);
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
