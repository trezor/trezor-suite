import * as baddress from '../src/address';
import * as NETWORKS from '../src/networks';
import * as bscript from '../src/script';
import fixtures from './__fixtures__/address';

// keyof typeof NETWORKS;
// @ts-ignore expression of type string can't be used to index type
const getNetwork = (name?: any) => (name ? NETWORKS[name] : NETWORKS.bitcoin);

describe('address', () => {
    describe('fromBase58Check', () => {
        fixtures.standard.forEach(f => {
            if (!f.base58check) return;
            it(`decodes ${f.base58check} (${f.network})`, () => {
                const decode = baddress.fromBase58Check(f.base58check, getNetwork(f.network));
                expect(decode.version).toEqual(f.version);
                expect(decode.hash.toString('hex')).toEqual(f.hash);
            });
        });

        fixtures.invalid.fromBase58Check.forEach(f => {
            it(`throws on ${f.exception}`, () => {
                expect(() => {
                    baddress.fromBase58Check(f.address, getNetwork(f.network));
                }).toThrowError(new RegExp(`${f.address} ${f.exception}`));
            });
        });
    });

    describe('fromBech32', () => {
        fixtures.standard.forEach(f => {
            if (!f.bech32) return;
            it(`decodes ${f.bech32}`, () => {
                const actual = baddress.fromBech32(f.bech32);
                expect(actual.version).toEqual(f.version);
                expect(actual.prefix).toEqual(getNetwork(f.network).bech32);
                expect(actual.data.toString('hex')).toEqual(f.data);
            });
        });

        fixtures.bech32.forEach(f => {
            it(`decodes ${f.address}`, () => {
                const actual = baddress.fromBech32(f.address);
                expect(actual.version).toEqual(f.version);
                expect(actual.data.toString('hex')).toEqual(f.data);
            });
        });

        fixtures.invalid.bech32.forEach(f => {
            it(`decode fails for ${f.address}(${f.exception})`, () => {
                expect(() => {
                    baddress.fromBech32(f.address);
                }).toThrowError(new RegExp(f.exception));
            });
        });
    });

    describe('fromOutputScript', () => {
        fixtures.standard.forEach(f => {
            it(`encodes ${f.script.slice(0, 30)}... (${f.network})`, () => {
                const script = bscript.fromASM(f.script);
                const address = baddress.fromOutputScript(script, getNetwork(f.network));
                expect(address).toEqual(f.base58check || f.bech32?.toLowerCase());
            });
        });

        fixtures.invalid.fromOutputScript.forEach(f => {
            it(`throws when ${f.script.slice(0, 30)}... ${f.exception}`, () => {
                const script = bscript.fromASM(f.script);
                expect(() => {
                    baddress.fromOutputScript(script);
                }).toThrowError(new RegExp(f.exception));
            });
        });
    });

    describe('toBase58Check', () => {
        fixtures.standard.forEach(f => {
            if (!f.base58check) return;
            it(`encodes ${f.hash} (${f.network})`, () => {
                const address = baddress.toBase58Check(
                    Buffer.from(f.hash, 'hex'),
                    f.version,
                    getNetwork(f.network),
                );

                expect(address).toEqual(f.base58check);
            });
        });
    });

    describe('toBech32', () => {
        fixtures.bech32.forEach(f => {
            const data = Buffer.from(f.data, 'hex');
            it(`encode ${f.address}`, () => {
                expect(baddress.toBech32(data, f.version, f.prefix)).toEqual(
                    f.address.toLowerCase(),
                );
            });
        });

        // TODO: These fixtures (according to TypeScript) have none of the data used below
        // fixtures.invalid.bech32.forEach((f, i) => {
        //     it(`encode fails (${f.exception}`, () => {
        //         expect(() => {
        //             baddress.toBech32(Buffer.from(f.data, 'hex'), f.version, f.prefix);
        //         }).toThrowError(new RegExp(f.exception));
        //     });
        // });
    });

    describe('toOutputScript', () => {
        fixtures.standard.forEach(f => {
            it(`decodes ${f.script.slice(0, 30)}... (${f.network})`, () => {
                const script = baddress.toOutputScript(
                    f.base58check || f.bech32 || '',
                    getNetwork(f.network),
                );

                expect(bscript.toASM(script)).toEqual(f.script);
            });
        });

        fixtures.invalid.toOutputScript.forEach(f => {
            it(`throws when ${f.exception} (${f.network})`, () => {
                const network = typeof f.network === 'string' ? getNetwork(f.network) : f.network;
                expect(() => {
                    baddress.toOutputScript(f.address, network);
                }).toThrowError(new RegExp(`${f.address} ${f.exception}`));
            });
        });
    });
});
