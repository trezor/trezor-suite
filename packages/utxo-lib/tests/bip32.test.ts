import * as BIP32 from '../src/bip32';
import * as NETWORKS from '../src/networks';
import fixtures from './__fixtures__/bip32';

// keyof typeof NETWORKS;
// @ts-expect-error expression of type string can't be used to index type
const getNetwork = (name?: any) => (name ? NETWORKS[name] : NETWORKS.bitcoin);

type F = typeof fixtures.valid;
type Fixture = F[number] & {
    depth?: number;
    index?: number;
};

function verify(hd: BIP32.BIP32Interface, prv: boolean, f: Fixture, network: NETWORKS.Network) {
    expect(hd.chainCode.toString('hex')).toEqual(f.chainCode);
    if (typeof f.depth === 'number') expect(hd.depth).toEqual(f.depth >>> 0);
    if (typeof f.index === 'number') expect(hd.index).toEqual(f.index >>> 0);
    expect(hd.compressed).toEqual(true);
    expect(hd.fingerprint.toString('hex')).toEqual(f.fingerprint);
    expect(hd.identifier.toString('hex')).toEqual(f.identifier);
    expect(hd.publicKey.toString('hex')).toEqual(f.pubKey);
    if (prv) expect(hd.toBase58()).toEqual(f.base58Priv);
    if (prv) expect(hd.privateKey?.toString('hex')).toEqual(f.privKey);
    if (prv) expect(hd.toWIF()).toEqual(f.wif);
    if (!prv) expect(() => hd.toWIF()).toThrow(/Missing private key/);
    if (!prv) expect(hd.privateKey).toEqual(undefined);
    expect(hd.neutered().toBase58()).toEqual(f.base58);
    expect(hd.isNeutered()).toEqual(!prv);

    if (!f.children) return;
    if (!prv && f.children.some(x => x.hardened)) return;

    // test deriving path from master
    f.children.forEach(cf => {
        const chd = hd.derivePath(cf.path);
        verify(chd, prv, cf as any, network);

        const chdNoM = hd.derivePath(cf.path.slice(2)); // no m/
        verify(chdNoM, prv, cf as any, network);
    });

    // test deriving path from successive children
    let shd = hd;
    f.children.forEach((cf: any) => {
        if (cf.m === undefined) return;
        if (cf.hardened) {
            shd = shd.deriveHardened(cf.m);
        } else {
            // verify any publicly derived children
            if (cf.base58) verify(shd.neutered().derive(cf.m), false, cf, network);

            shd = shd.derive(cf.m);
            verify(shd, prv, cf, network);
        }

        expect(() => {
            shd.derivePath('m/0');
        }).toThrow(/Expected master, got child/);

        verify(shd, prv, cf, network);
    });
}

describe('success', () => {
    fixtures.valid.forEach(f => {
        const network = getNetwork(f.network);

        it(`from base58Priv: ${f.comment || f.base58Priv}`, () => {
            const hd = BIP32.fromBase58(f.base58Priv, network);
            verify(hd, true, f, network);
        });

        it(`from base58: ${f.base58}`, () => {
            const hd = BIP32.fromBase58(f.base58, network);
            verify(hd, false, f, network);
        });

        if (f.seed) {
            it(`from seed: ${f.seed}`, () => {
                const seed = Buffer.from(f.seed, 'hex');
                const hd = BIP32.fromSeed(seed, network);
                verify(hd, true, f, network);
            });
        }

        if (f.children) {
            f.children.forEach(fc => {
                it(`child from base58Priv: ${f.base58Priv}`, () => {
                    const hd = BIP32.fromBase58(fc.base58Priv, network);
                    verify(hd, true, fc as any, network);
                });
                it(`child from base58: ${f.base58}`, () => {
                    const hd = BIP32.fromBase58(fc.base58, network);
                    verify(hd, false, fc as any, network);
                });
            });
        }
    });
});

describe('fromBase58 throws', () => {
    fixtures.invalid.fromBase58.forEach(f => {
        it(`throws ${f.exception}`, () => {
            expect(() => {
                BIP32.fromBase58(f.string, getNetwork(f.network));
            }).toThrow(new RegExp(`${f.exception}`));
        });
    });
});

it('works for Private -> public (neutered)', () => {
    const f = fixtures.valid[1];
    const c = f.children[0] as any;
    const master = BIP32.fromBase58(f.base58Priv);
    const child = master.derive(c.m).neutered();

    expect(child.toBase58()).toEqual(c.base58);
});

it('works for Private -> public (neutered, hardened)', () => {
    const f = fixtures.valid[0];
    const c = f.children[0] as any;
    const master = BIP32.fromBase58(f.base58Priv);
    const child = master.deriveHardened(c.m).neutered();

    expect(c.base58).toEqual(child.toBase58());
});

it('works for Public -> public', () => {
    const f = fixtures.valid[1];
    const c = f.children[0] as any;
    const master = BIP32.fromBase58(f.base58);
    const child = master.derive(c.m);

    expect(c.base58).toEqual(child.toBase58());
});

it('throws on Public -> public (hardened)', () => {
    const f = fixtures.valid[1];
    const c = f.children[0] as any;
    const master = BIP32.fromBase58(f.base58);
    expect(() => {
        master.deriveHardened(c.m);
    }).toThrow(/Missing private key for hardened child key/);
});

it('throws on wrong types', () => {
    const f = fixtures.valid[0];
    const master = BIP32.fromBase58(f.base58);

    fixtures.invalid.derive.forEach(fx => {
        expect(() => {
            master.derive(fx as any);
        }).toThrow(/Expected UInt32/);
    });

    fixtures.invalid.deriveHardened.forEach(fx => {
        expect(() => {
            master.deriveHardened(fx as any);
        }).toThrow(/Expected UInt31/);
    });

    fixtures.invalid.derivePath.forEach(fx => {
        expect(() => {
            master.derivePath(fx as any);
        }).toThrow(/Expected BIP32Path, got/);
    });

    const ZERO = Buffer.alloc(32, 0);
    const ONES = Buffer.alloc(32, 1);

    expect(() => {
        BIP32.fromPrivateKey(Buffer.alloc(2), ONES);
    }).toThrow(
        /Expected property "privateKey" of type Buffer\(Length: 32\), got Buffer\(Length: 2\)/,
    );

    expect(() => {
        BIP32.fromPrivateKey(ZERO, ONES);
    }).toThrow(/Private key not in range \[1, n\)/);
});

it('works when private key has leading zeros', () => {
    const key =
        'xprv9s21ZrQH143K3ckY9DgU79uMTJkQRLdbCCVDh81SnxTgPzLLGax6uHeBULTtaEtcAvKjXfT7ZWtHzKjTpujMkUd9dDb8msDeAfnJxrgAYhr';
    const hdkey = BIP32.fromBase58(key);

    expect(hdkey.privateKey?.toString('hex')).toEqual(
        '00000055378cf5fafb56c711c674143f9b0ee82ab0ba2924f19b64f5ae7cdbfd',
    );
    const child = hdkey.derivePath("m/44'/0'/0'/0/0'");
    expect(child.privateKey?.toString('hex')).toEqual(
        '3348069561d2a0fb925e74bf198762acc47dce7db27372257d2d959a9e6f8aeb',
    );
});

it('fromSeed', () => {
    // TODO
    //    'throws if IL is not within interval [1, n - 1] | IL === n || IL === 0'
    fixtures.invalid.fromSeed.forEach(f => {
        expect(() => {
            BIP32.fromSeed(Buffer.from(f.seed, 'hex'));
        }).toThrow(new RegExp(f.exception));
    });
});

it('ecdsa', () => {
    const seed = Buffer.alloc(32, 1);
    const hash = Buffer.alloc(32, 2);
    const signature = Buffer.from(
        '9636ee2fac31b795a308856b821ebe297dda7b28220fb46ea1fbbd7285977cc04c82b734956246a0f15a9698f03f546d8d96fe006c8e7bd2256ca7c8229e6f5c',
        'hex',
    );
    const signatureLowR = Buffer.from(
        '0587a40b391b76596c257bf59565b24eaff2cc42b45caa2640902e73fb97a6e702c3402ab89348a7dae1bf171c3e172fa60353d7b01621a94cb7caca59b995db',
        'hex',
    );
    const node = BIP32.fromSeed(seed);

    expect(node.sign(hash).toString('hex')).toEqual(signature.toString('hex'));
    expect(node.sign(hash, true).toString('hex')).toEqual(signatureLowR.toString('hex'));
    expect(node.verify(hash, signature)).toEqual(true);
    expect(node.verify(seed, signature)).toEqual(false);
    expect(node.verify(hash, signatureLowR)).toEqual(true);
    expect(node.verify(seed, signatureLowR)).toEqual(false);
});

it('sign throws on a neutered (public-only) BIP32', () => {
    const seed = Buffer.alloc(32, 1);
    const hash = Buffer.alloc(32, 2);
    const neuteredNode = BIP32.fromSeed(seed).neutered();

    expect(neuteredNode.isNeutered()).toEqual(true);
    expect(neuteredNode.privateKey).toEqual(undefined);
    expect(() => neuteredNode.sign(hash)).toThrow(/Missing private key/);
});

it('fromPublicKey defaults network to bitcoin when omitted (BIP32 test-vector-1 master pubKey)', () => {
    // BIP32 test vector 1 master pubKey + chainCode (from tests/__fixtures__/bip32.ts valid[0]).
    // Calling BIP32.fromPublicKey without a third arg drives:
    //  (a) the `network = network || BITCOIN` right-arm at src/bip32.ts:83 (binary-expr branch 4),
    //  (b) the previously-uncovered `fromPublicKey` exported function at src/bip32.ts:416 (fn 25).
    const pubKey = Buffer.from(
        '0339a36013301597daef41fbe593a02cc513d0b55527ec2df1050e2e8ff49c85c2',
        'hex',
    );
    const chainCode = Buffer.from(
        '873dff81c02f525623fd1fe5167eac3a55a049de3d314bb42ee227ffed37d508',
        'hex',
    );
    const hd = BIP32.fromPublicKey(pubKey, chainCode);

    expect(hd.network).toEqual(NETWORKS.bitcoin);
    expect(hd.publicKey.toString('hex')).toEqual(
        '0339a36013301597daef41fbe593a02cc513d0b55527ec2df1050e2e8ff49c85c2',
    );
    // hash160 of the pubKey — proves the bitcoin (not decred) identifier path ran.
    expect(hd.identifier.toString('hex')).toEqual('3442193e1bb70916e914552172cd4e2dbc9df811');
    expect(hd.isNeutered()).toEqual(true);
});

it('identifier on a Decred-typed BIP32 uses hash160blake256 not hash160', () => {
    // Decred's real network has wif=0x22de which exceeds the BIP32 NETWORK_TYPE
    // wif:UInt8 schema, so we construct a synthetic network that still matches
    // isNetworkType('decred', ...) via its bip32 public/private fields but has a
    // BIP32-compatible wif. Only the identifier branch at bip32.ts:153 is being
    // exercised — the wif value is never read by .identifier.
    const seed = Buffer.alloc(32, 1);
    const decredCompat = { ...NETWORKS.decred, wif: 0xde };
    const decredNode = BIP32.fromSeed(seed, decredCompat);
    const bitcoinNode = BIP32.fromSeed(seed);

    expect(NETWORKS.isNetworkType('decred', decredCompat)).toEqual(true);
    expect(decredNode.publicKey.toString('hex')).toEqual(bitcoinNode.publicKey.toString('hex'));
    expect(decredNode.identifier.toString('hex')).toEqual(
        '906ed54603b5f682e4a556740c401b7765764095',
    );
    expect(decredNode.identifier.toString('hex')).not.toEqual(
        bitcoinNode.identifier.toString('hex'),
    );
});

it('fromBase58 round-trips a Decred-typed extended key via decodeBlake256Key', () => {
    // Drives the previously-uncovered truthy arm of the cond-expr at bip32.ts:358 —
    // isNetworkType('decred', network) ? bs58check.decodeBlake256Key(...) : bs58check.decode(...).
    // toBase58 routes through encodeBlake256 (blake256 double-hash checksum) when the
    // node's network is Decred-typed, and fromBase58 must use decodeBlake256Key to
    // round-trip — the bitcoin bs58check.decode (sha256-double-hash checksum) would
    // throw 'Invalid checksum' on the blake-encoded string. Same synthetic
    // decredCompat workaround as the prior identifier test (wif:0xde so BIP32's
    // NETWORK_TYPE schema accepts it).
    const seed = Buffer.alloc(32, 1);
    const decredCompat = { ...NETWORKS.decred, wif: 0xde };
    const original = BIP32.fromSeed(seed, decredCompat);
    const encoded = original.toBase58();
    const decoded = BIP32.fromBase58(encoded, decredCompat);

    expect(decoded.identifier.toString('hex')).toEqual(original.identifier.toString('hex'));
    expect(decoded.privateKey?.toString('hex')).toEqual(original.privateKey?.toString('hex'));
    expect(decoded.chainCode.toString('hex')).toEqual(original.chainCode.toString('hex'));
});
