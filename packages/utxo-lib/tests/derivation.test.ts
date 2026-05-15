import fixtures from './__fixtures__/derivation';
import { deriveAddresses, getXpubOrDescriptorInfo } from '../src/derivation';
import { litecoin, regtest, testnet } from '../src/networks';

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

describe('getXpubOrDescriptorInfo descriptor parse errors', () => {
    it('throws when a pkh(...) descriptor body does not match the structural regex', () => {
        expect(() => getXpubOrDescriptorInfo('pkh(invalid)')).toThrow(
            /Descriptor cannot be parsed: pkh\(invalid\)/,
        );
    });

    it('throws Unknown xpub version when given an xprv whose 4-byte version is not in BIP32_PAYMENT_TYPES', () => {
        const xprv =
            'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi';
        expect(() => getXpubOrDescriptorInfo(xprv)).toThrow(`Unknown xpub version: ${xprv}`);
    });
});

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
