import * as baddress from '../src/address';
import * as NETWORKS from '../src/networks';
import * as bscript from '../src/script';
import fixtures from './__fixtures__/address';

// keyof typeof NETWORKS;
// @ts-expect-error expression of type string can't be used to index type
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
                }).toThrow(new RegExp(`${f.address} ${f.exception}`));
            });
        });

        it('decodes a mainnet p2pkh address using the default bitcoin network argument', () => {
            const decode = baddress.fromBase58Check('1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH');
            expect(decode.version).toEqual(0);
            expect(decode.hash.toString('hex')).toEqual('751e76e8199196d454941c45d1b3a323f1433bd6');
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
            it(`decode errors for ${f.address}(${f.exception})`, () => {
                expect(() => {
                    baddress.fromBech32(f.address);
                }).toThrow(new RegExp(f.exception));
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
                }).toThrow(new RegExp(f.exception));
            });
        });

        it('throws when a witness-v2 script has a push-length byte that disagrees with the trailing data length', () => {
            // OP_2 (0x52) + push-length 0x14 (declaring 20 bytes) + only 18 bytes of data;
            // exercises toFutureSegwitAddress's `if (output[1] !== data.length) throw` branch.
            const malformed = Buffer.from('5214000102030405060708090a0b0c0d0e0f1011', 'hex');
            expect(() => baddress.fromOutputScript(malformed)).toThrow('has no matching Address');
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
        // eslint-disable-next-line jest/no-commented-out-tests
        //     it(`encode errors (${f.exception}`, () => {
        //         expect(() => {
        //             baddress.toBech32(Buffer.from(f.data, 'hex'), f.version, f.prefix);
        //         }).toThrow(new RegExp(f.exception));
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
                }).toThrow(new RegExp(`${f.address} ${f.exception}`));
            });
        });
    });

    describe('getAddressType', () => {
        fixtures.addressTypes.forEach(([network, address, type]) => {
            it(`${network} ${address}`, () => {
                expect(baddress.getAddressType(address, getNetwork(network))).toBe(type);
            });
        });

        it('classifies a mainnet p2pkh address using the default bitcoin network argument', () => {
            expect(baddress.getAddressType('1NSAR5mUUL3qZP29BfFj5jBPR5yWiiZZWi')).toBe('p2pkh');
        });
    });
});
