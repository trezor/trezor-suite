import * as networks from '../src/networks';

const { isNetworkType } = networks;

type Key = Exclude<keyof typeof networks, 'isNetworkType'>;
const defs = Object.keys(networks).reduce((n, key) => {
    if (typeof networks[key as Key] !== 'object') {
        return n;
    }
    return n.concat([key as Key]);
}, [] as Key[]);

describe('isNetworkType', () => {
    defs.forEach(name => {
        const isBCH = name === 'bitcoincash' || name === 'bitcoincashTest';
        it(`${name} ${isBCH ? 'is' : 'is not'} bitcoinCash type`, () => {
            expect(isNetworkType('bitcoinCash', networks[name])).toBe(isBCH);
        });
    });

    defs.forEach(name => {
        const isDash = name === 'dash' || name === 'dashTest';
        it(`${name} ${isDash ? 'is' : 'is not'} dash type`, () => {
            expect(isNetworkType('dash', networks[name])).toBe(isDash);
        });
    });

    defs.forEach(name => {
        const isDecred = name === 'decred' || name === 'decredSim' || name === 'decredTest';
        it(`${name} ${isDecred ? 'is' : 'is not'} decred type`, () => {
            expect(isNetworkType('decred', networks[name])).toBe(isDecred);
        });
    });

    defs.forEach(name => {
        const isPeercoin = name === 'peercoin' || name === 'peercoinTest';
        it(`${name} ${isPeercoin ? 'is' : 'is not'} peercoin type`, () => {
            expect(isNetworkType('peercoin', networks[name])).toBe(isPeercoin);
        });
    });

    defs.forEach(name => {
        const isZcash = name === 'zcash' || name === 'zcashTest' || name === 'komodo';
        it(`${name} ${isZcash ? 'is' : 'is not'} zcash type`, () => {
            expect(isNetworkType('zcash', networks[name])).toBe(isZcash);
        });
    });

    it('invalid params', () => {
        // @ts-expect-error invalid type param
        expect(isNetworkType('invalid-type', {})).toBe(false);
        // network not defined
        expect(isNetworkType('zcash', undefined)).toBe(false);
        // @ts-expect-error invalid network param
        expect(isNetworkType('zcash', {})).toBe(false);
        // @ts-expect-error invalid network param
        expect(isNetworkType('zcash', 'string')).toBe(false);

        expect(
            isNetworkType('zcash', {
                bip32: {
                    public: 1,
                    private: 1,
                },
                pubKeyHash: 1,
                // @ts-expect-error invalid network field
                scriptHash: 'A',
            }),
        ).toBe(false);
    });
});
