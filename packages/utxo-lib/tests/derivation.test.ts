import fixtures from './__fixtures__/derivation';
import { deriveAddresses } from '../src/derivation';
import { testnet, regtest, litecoin } from '../src/networks';

const getNetwork = (symbol?: string) => {
    switch (symbol) {
        case 'test':
            return testnet;
        case 'regtest':
            return regtest;
        case 'ltc':
            return litecoin;
        default:
            break;
    }
};

describe('Testing address derivation from xpubs', () => {
    fixtures.derivation.forEach(f => {
        it(f.description, () => {
            const { xpubs, change, receive, pathPrefix, symbol } = f;
            const network = getNetwork(symbol);

            xpubs.forEach(xpub => {
                const rec = deriveAddresses(xpub, 'receive', 0, receive.length, network);
                expect(
                    receive.map((address, i) => ({
                        address,
                        path: `${pathPrefix}/0/${i}`,
                    })),
                ).toEqual(rec);

                const cng = deriveAddresses(xpub, 'change', 0, change.length, network);
                expect(
                    change.map((address, i) => ({
                        address,
                        path: `${pathPrefix}/1/${i}`,
                    })),
                ).toEqual(cng);
            });
        });
    });
});
