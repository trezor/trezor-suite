import { getAllNetworks, getCoinInfoOrThrow, getUniqueNetworks } from '../coinInfo';

describe('data/coinInfo', () => {
    it('getUniqueNetworks', () => {
        const inputs = [
            getCoinInfoOrThrow('btc'),
            getCoinInfoOrThrow('ltc'),
            getCoinInfoOrThrow('btc'),
            getCoinInfoOrThrow('ltc'),
            getCoinInfoOrThrow('ltc'),
        ];
        const result = [getCoinInfoOrThrow('btc'), getCoinInfoOrThrow('ltc')];
        expect(getUniqueNetworks(inputs)).toEqual(result);
    });

    it('bitcoin network blocktime', () => {
        const bitcoinNetworks = getAllNetworks().filter(({ type }) => type === 'bitcoin');
        bitcoinNetworks.forEach(network => {
            expect(network.blockTime).toBeGreaterThan(0);
        });
    });
});
