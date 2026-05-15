import * as utils from './payments.utils';
import * as PAYMENTS from '../src/payments';
import type { PaymentCreator } from '../src/types';

(
    [
        'embed',
        'p2ms',
        'p2pk',
        'p2pkh',
        'p2sh',
        'p2tr',
        'p2wpkh',
        'p2wsh',
        'sstxchange',
        'sstxcommitment',
        'sstxpkh',
        'sstxsh',
    ] as const
).forEach(p => {
    describe(p, () => {
        const fn: PaymentCreator = PAYMENTS[p];
        const { fixtures } = require(`./__fixtures__/payments/${p}`);

        fixtures.valid.forEach((f: any) => {
            it(`${f.description} as expected`, () => {
                const args = utils.preform(f.arguments);
                const actual = fn(args, f.options);

                utils.equate(actual, f.expected, f.arguments);
            });

            it(`${f.description} as expected (no validation)`, () => {
                const args = utils.preform(f.arguments);
                const actual = fn(args, { ...f.options, validate: false });

                utils.equate(actual, f.expected, f.arguments);
            });
        });

        fixtures.invalid.forEach((f: any) => {
            it(`throws ${f.exception} ${f.description ? `for ${f.description}` : ''}`, () => {
                const args = utils.preform(f.arguments);

                expect(() => fn(args, f.options)).toThrow(f.exception);
            });
        });

        if (p === 'p2sh') {
            const { p2wsh, p2pk } = PAYMENTS;
            it('properly assembles nested p2wsh with names', () => {
                const actual = fn({
                    redeem: p2wsh({
                        redeem: p2pk({
                            pubkey: Buffer.from(
                                '03e15819590382a9dd878f01e2f0cbce541564eb415e43b440472d883ecd283058',
                                'hex',
                            ),
                        }),
                    }),
                });
                expect(actual.address).toBe('3MGbrbye4ttNUXM8WAvBFRKry4fkS9fjuw');
                expect(actual.name).toBe('p2sh-p2wsh-p2pk');
                expect(actual.redeem!.name).toBe('p2wsh-p2pk');
                expect(actual.redeem!.redeem!.name).toBe('p2pk');
            });
        }

        // cross-verify dynamically too
        if (!fixtures.dynamic) return;
        const { depends, details } = fixtures.dynamic;

        details.forEach((f: any) => {
            const detail = utils.preform(f);
            const disabled: any = {};
            if (f.disabled)
                f.disabled.forEach((k: string) => {
                    disabled[k] = true;
                });

            for (const key in depends) {
                if (key in disabled) continue;
                const dependencies = depends[key];

                dependencies.forEach((dependency: any) => {
                    if (!Array.isArray(dependency)) dependency = [dependency];

                    const args: any = {};
                    dependency.forEach((d: any) => {
                        utils.from(d, detail, args);
                    });
                    if (detail.network) {
                        args.network = detail.network;
                    }
                    if (detail.amount) {
                        args.amount = detail.amount;
                    }
                    const expected = utils.from(key, detail);

                    it(`${f.description}, ${key} derives from ${JSON.stringify(
                        dependency,
                    )}`, () => {
                        utils.equate(fn(args), expected);
                    });
                });
            }
        });
    });
});

describe('p2pk lazy output getter', () => {
    it('returns undefined when only signature is provided and pubkey is missing', () => {
        const signature = Buffer.from('300602010002010001', 'hex');
        const p = PAYMENTS.p2pk({ signature });
        expect(p.output).toBeUndefined();
    });
});

describe('p2pk lazy pubkey getter', () => {
    it('returns undefined when only signature is provided and output is missing', () => {
        const signature = Buffer.from('300602010002010001', 'hex');
        const p = PAYMENTS.p2pk({ signature });
        expect(p.pubkey).toBeUndefined();
    });
});

describe('p2pkh lazy pubkey getter', () => {
    it('returns undefined when only hash is provided and input is missing', () => {
        const hash = Buffer.from('168b992bcfc44050310b3a94bd0771136d0b28d1', 'hex');
        const p = PAYMENTS.p2pkh({ hash });
        expect(p.pubkey).toBeUndefined();
    });
});

describe('p2pkh non-canonical signature', () => {
    it('throws "Expected canonical script signature" when signature fails bip66 check', () => {
        const hash = Buffer.from('168b992bcfc44050310b3a94bd0771136d0b28d1', 'hex');
        const signature = Buffer.from('3044', 'hex');
        expect(() => PAYMENTS.p2pkh({ hash, signature })).toThrow(
            'Expected canonical script signature',
        );
    });
});

describe('p2pkh lazy address getter', () => {
    it('returns undefined when input alone is provided and hash cannot be derived', () => {
        const p = PAYMENTS.p2pkh({ input: Buffer.alloc(0) }, { validate: false });
        expect(p.address).toBeUndefined();
    });
});

describe('p2pkh lazy output getter', () => {
    it('returns undefined when input alone is provided and hash cannot be derived', () => {
        const p = PAYMENTS.p2pkh({ input: Buffer.alloc(0) }, { validate: false });
        expect(p.output).toBeUndefined();
    });
});

describe('p2wpkh non-canonical signature', () => {
    it('throws "Expected canonical script signature" when signature fails bip66 check', () => {
        const hash = Buffer.from('168b992bcfc44050310b3a94bd0771136d0b28d1', 'hex');
        const signature = Buffer.from('3044', 'hex');
        expect(() => PAYMENTS.p2wpkh({ hash, signature })).toThrow(
            'Expected canonical script signature',
        );
    });
});

describe('p2wpkh lazy pubkey getter', () => {
    it('returns undefined when only hash is provided and witness is missing', () => {
        const hash = Buffer.from('168b992bcfc44050310b3a94bd0771136d0b28d1', 'hex');
        const p = PAYMENTS.p2wpkh({ hash });
        expect(p.pubkey).toBeUndefined();
    });
});

describe('p2wpkh lazy address getter', () => {
    it('returns undefined when only an empty witness is provided and hash cannot be derived', () => {
        const p = PAYMENTS.p2wpkh({ witness: [] }, { validate: false });
        expect(p.address).toBeUndefined();
    });
});

describe('p2wpkh lazy output getter', () => {
    it('returns undefined when only an empty witness is provided and hash cannot be derived', () => {
        const p = PAYMENTS.p2wpkh({ witness: [] }, { validate: false });
        expect(p.output).toBeUndefined();
    });
});

describe('p2wsh lazy address getter', () => {
    it('returns undefined when only an empty witness is provided and hash cannot be derived', () => {
        const p = PAYMENTS.p2wsh({ witness: [] }, { validate: false });
        expect(p.address).toBeUndefined();
    });
});

describe('p2wsh lazy output getter', () => {
    it('returns undefined when only an empty witness is provided and hash cannot be derived', () => {
        const p = PAYMENTS.p2wsh({ witness: [] }, { validate: false });
        expect(p.output).toBeUndefined();
    });
});

describe('p2wsh lazy witness getter without redeem.output', () => {
    it('returns undefined when redeem is provided without an output', () => {
        const p = PAYMENTS.p2wsh({ redeem: {} });
        expect(p.witness).toBeUndefined();
    });
});

describe('p2tr address with wrong data length', () => {
    it('throws Invalid address data when bech32m address decodes to a non-32-byte payload', () => {
        const { bech32m } = require('@scure/base');
        const data = new Uint8Array(33);
        const address = bech32m.encode('bc', [0x01, ...bech32m.toWords(data)]);
        expect(() => PAYMENTS.p2tr({ address })).toThrow('Invalid address data');
    });
});

describe('p2sh lazy address getter', () => {
    it('returns undefined when input alone is provided and hash cannot be derived', () => {
        const p = PAYMENTS.p2sh({ input: Buffer.alloc(0) }, { validate: false });
        expect(p.address).toBeUndefined();
    });
});

describe('p2sh lazy output getter', () => {
    it('returns undefined when input alone is provided and hash cannot be derived', () => {
        const p = PAYMENTS.p2sh({ input: Buffer.alloc(0) }, { validate: false });
        expect(p.output).toBeUndefined();
    });
});

describe('p2sh witness/redeem.witness length mismatch', () => {
    it('throws "Witness and redeem.witness mismatch" when stacks have different lengths', () => {
        const witness = [Buffer.from('aa', 'hex')];
        const redeem = { witness: [Buffer.from('aa', 'hex'), Buffer.from('bb', 'hex')] };
        expect(() => PAYMENTS.p2sh({ witness, redeem })).toThrow(
            'Witness and redeem.witness mismatch',
        );
    });
});

describe('p2ms lazy output getter without m', () => {
    it('returns undefined when only signatures are provided and m is missing', () => {
        const signature = Buffer.from('300602010002010001', 'hex');
        const p = PAYMENTS.p2ms({ signatures: [signature] }, { validate: false });
        expect(p.output).toBeUndefined();
    });
});

describe('p2ms lazy name getter without m', () => {
    it('returns undefined when only signatures are provided and m/n are missing', () => {
        const signature = Buffer.from('300602010002010001', 'hex');
        const p = PAYMENTS.p2ms({ signatures: [signature] }, { validate: false });
        expect(p.name).toBeUndefined();
    });
});

describe('sstxcommitment lazy address getter without hash', () => {
    it('returns undefined when only amount is provided and hash is missing', () => {
        const p = PAYMENTS.sstxcommitment({ amount: '1' });
        expect(p.address).toBeUndefined();
    });
});

describe('sstxcommitment lazy output getter without amount', () => {
    it('returns undefined when only hash is provided and amount is missing', () => {
        const p = PAYMENTS.sstxcommitment({ hash: Buffer.alloc(20) });
        expect(p.output).toBeUndefined();
    });
});

describe('sstxsh lazy address getter with explicit hash=undefined', () => {
    it('returns undefined when hash is explicitly undefined and output is provided', () => {
        const output = Buffer.concat([
            Buffer.from([0xba, 0xa9, 0x14]),
            Buffer.alloc(20, 1),
            Buffer.from([0x87]),
        ]);
        const p = PAYMENTS.sstxsh({ hash: undefined, output });
        expect(p.address).toBeUndefined();
    });
});

describe('sstxsh lazy output getter with explicit hash=undefined', () => {
    it('returns undefined when hash is explicitly undefined and address is provided', () => {
        const p = PAYMENTS.sstxsh({
            hash: undefined,
            address: 'DcqpxMjckSty7zc4fL3CCPPGz1NWdiYsBXZ',
        });
        expect(p.output).toBeUndefined();
    });
});

describe('sstxchange lazy address getter with explicit hash=undefined', () => {
    it('returns undefined when hash is explicitly undefined and output is provided', () => {
        const output = Buffer.concat([
            Buffer.from([0xbd, 0x76, 0xa9, 0x14]),
            Buffer.alloc(20, 1),
            Buffer.from([0x88, 0xac]),
        ]);
        const p = PAYMENTS.sstxchange({ hash: undefined, output });
        expect(p.address).toBeUndefined();
    });
});

describe('sstxchange lazy output getter with explicit hash=undefined', () => {
    it('returns undefined when hash is explicitly undefined and address is provided', () => {
        const { decred } = require('../src/networks');
        const p = PAYMENTS.sstxchange({
            hash: undefined,
            address: 'DsbeB3ap3RiS4CLpgd1yXMSKLdrNMppeBE9',
            network: decred,
        });
        expect(p.output).toBeUndefined();
    });
});

describe('sstxpkh lazy address getter with explicit hash=undefined', () => {
    it('returns undefined when hash is explicitly undefined and output is provided', () => {
        const output = Buffer.concat([
            Buffer.from([0xba, 0x76, 0xa9, 0x14]),
            Buffer.alloc(20, 1),
            Buffer.from([0x88, 0xac]),
        ]);
        const p = PAYMENTS.sstxpkh({ hash: undefined, output });
        expect(p.address).toBeUndefined();
    });
});

describe('sstxpkh lazy output getter with explicit hash=undefined', () => {
    it('returns undefined when hash is explicitly undefined and address is provided', () => {
        const { decred } = require('../src/networks');
        const p = PAYMENTS.sstxpkh({
            hash: undefined,
            address: 'DsbeB3ap3RiS4CLpgd1yXMSKLdrNMppeBE9',
            network: decred,
        });
        expect(p.output).toBeUndefined();
    });
});
