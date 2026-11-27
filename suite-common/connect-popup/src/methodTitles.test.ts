import { getBitcoinNetworkOrThrow } from '@trezor/connect-core/src/data/coinInfo';

import { getNetworkLabel, getUniqueNetworks } from './methodTitles';

const bitcoin = getBitcoinNetworkOrThrow('btc');
const litecoin = getBitcoinNetworkOrThrow('ltc');

describe('methodTitles', () => {
    it('names the network in a label', () => {
        expect(getNetworkLabel('Export #NETWORK address', { name: 'Ethereum' })).toBe(
            'Export Ethereum address',
        );
        expect(getNetworkLabel('Sign #NETWORK message', { name: 'Ethereum Testnet Sepolia' })).toBe(
            'Sign Testnet message',
        );
    });

    it('lists each network once', () => {
        expect(getUniqueNetworks([bitcoin, undefined, litecoin, bitcoin])).toEqual([
            bitcoin,
            litecoin,
        ]);
    });
});
