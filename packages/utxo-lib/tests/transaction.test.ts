import * as utils from './transaction.utils';
import * as NETWORKS from '../src/networks';
import { Transaction } from '../src/transaction';
import fixturesBitcoin from './__fixtures__/transaction/bitcoin';
import fixturesBitcoinCash from './__fixtures__/transaction/bitcoinCash';
import fixturesDash from './__fixtures__/transaction/dash';
import fixturesDecred from './__fixtures__/transaction/decred';
import fixturesDoge from './__fixtures__/transaction/doge';
import fixturesKomodo from './__fixtures__/transaction/komodo';
import fixturesLitecoin from './__fixtures__/transaction/litecoin';
import fixturesPeercoin from './__fixtures__/transaction/peercoin';
import fixturesZcash from './__fixtures__/transaction/zcash';

describe('Transaction', () => {
    describe('import fromBuffer/fromHex', () => {
        // common function for multiple fixtures
        const importExport = (f: utils.Fixture) => {
            const { description, hash, whex } = f;
            const options = { network: utils.getNetwork(f.network) };

            it(`${description} (${hash})`, () => {
                const tx = Transaction.fromHex(f.hex, options);
                utils.checkTx(tx, f.raw);
                expect(tx.toHex()).toEqual(f.hex);
            });

            if (whex) {
                it(`${description} (${hash}) as witness`, () => {
                    const tx = Transaction.fromHex(whex, options);
                    utils.checkTx(tx, f.raw);
                    expect(tx.toHex()).toEqual(whex);
                });
            }
        };

        fixturesBitcoin.valid.forEach(importExport);

        fixturesBitcoinCash.valid.forEach(importExport);

        fixturesDash.valid.forEach(importExport);

        fixturesDoge.valid.forEach(importExport);

        fixturesKomodo.valid.forEach(importExport);

        fixturesPeercoin.valid.forEach(importExport);

        fixturesZcash.valid.forEach(importExport);

        fixturesLitecoin.valid.forEach(importExport);

        // Decred requires special check for tree and witness
        fixturesDecred.valid.forEach(f => {
            it(f.description, () => {
                const tx = Transaction.fromHex(f.hex, {
                    network: utils.getNetwork(f.network),
                });

                expect(tx.version).toEqual(f.raw.version);
                expect(tx.type).toEqual(f.raw.type);
                expect(tx.ins.length).toEqual(f.raw.ins.length);
                expect(tx.outs.length).toEqual(f.raw.outs.length);
                expect(tx.locktime).toEqual(f.raw.locktime);
                expect(tx.expiry).toEqual(f.raw.expiry);
                tx.ins.forEach((input, i) => {
                    const expected = f.raw.ins[i] as any;
                    expect(input.hash.toString('hex')).toEqual(expected.hash);
                    expect(input.index).toEqual(expected.index);
                    expect(input.decredTree).toEqual(expected.tree);
                    expect(input.sequence).toEqual(expected.sequence);
                    if (tx.hasWitnesses() && input.decredWitness) {
                        const witness = input.decredWitness;
                        expect(witness.script.toString('hex')).toEqual(expected.script);
                        expect(witness.value).toEqual(expected.value);
                        expect(witness.height).toEqual(expected.height);
                        expect(witness.blockIndex).toEqual(expected.blockIndex);
                    }
                });
                tx.outs.forEach((output, i) => {
                    expect(output.value).toEqual(f.raw.outs[i].value);
                    expect(output.script.toString('hex')).toEqual(f.raw.outs[i].script);
                    expect(output.decredVersion).toEqual(f.raw.outs[i].version);
                });

                expect(tx.toHex()).toEqual(f.hex);
            });
        });

        it('.version should be interpreted as an int32le', () => {
            const txHex = 'ffffffff0000ffffffff';
            const tx = Transaction.fromHex(txHex);
            expect(tx.version).toEqual(-1);
            expect(tx.locktime).toEqual(0xffffffff);
        });

        it('default options: new Transaction() and Transaction.fromBuffer(buffer) without options fall through to bitcoin', () => {
            const txEmpty = new Transaction();
            expect(txEmpty.ins).toEqual([]);
            expect(txEmpty.outs).toEqual([]);
            expect(txEmpty.network).toEqual(NETWORKS.bitcoin);

            const txParsed = Transaction.fromBuffer(Buffer.from('ffffffff0000ffffffff', 'hex'));
            expect(txParsed.version).toEqual(-1);
            expect(txParsed.locktime).toEqual(0xffffffff);
            expect(txParsed.network).toEqual(NETWORKS.bitcoin);
        });

        fixturesBitcoin.hashForSignature.forEach(f => {
            it(`${f.description} (${f.hash})`, () => {
                const tx = Transaction.fromHex(f.txHex);
                expect(tx.toHex()).toEqual(f.txHex);
            });
        });

        fixturesBitcoin.hashForWitnessV0.forEach(f => {
            it(`${f.description} (${f.hash})`, () => {
                const tx = Transaction.fromHex(f.txHex);
                expect(tx.toHex()).toEqual(f.txHex);
            });
        });

        fixturesBitcoin.invalid.fromBuffer.forEach(f => {
            it(`throws on ${f.exception}`, () => {
                expect(() => Transaction.fromHex(f.hex)).toThrow(f.exception);
            });
        });

        fixturesDecred.invalid.forEach(f => {
            it(`Decred: throws ${f.exception} for ${f.description}`, () => {
                expect(() => Transaction.fromHex(f.hex, { network: NETWORKS.decred })).toThrow(
                    f.exception,
                );
            });
        });

        it('Peercoin: throws on Transaction has unexpected data when hex has trailing bytes', () => {
            const validHex = fixturesPeercoin.valid[0].hex;
            const badHex = `${validHex}ff`;
            expect(() => Transaction.fromHex(badHex, { network: NETWORKS.peercoin })).toThrow(
                'Transaction has unexpected data',
            );
        });

        it('Peercoin: nostrict=true skips trailing-data check and returns the parsed transaction', () => {
            const validHex = fixturesPeercoin.valid[0].hex;
            const badBuf = Buffer.from(`${validHex}ff`, 'hex');
            const tx = Transaction.fromBuffer(badBuf, {
                network: NETWORKS.peercoin,
                nostrict: true,
            });
            expect(tx.version).toEqual(fixturesPeercoin.valid[0].raw.version);
            expect(tx.locktime).toEqual(fixturesPeercoin.valid[0].raw.locktime);
            expect(tx.ins.length).toEqual(fixturesPeercoin.valid[0].raw.ins.length);
            expect(tx.outs.length).toEqual(fixturesPeercoin.valid[0].raw.outs.length);
        });

        it('Peercoin: toBuffer with explicit non-zero initialOffset returns a subarray starting at that offset', () => {
            const validHex = fixturesPeercoin.valid[0].hex;
            const tx = Transaction.fromHex(validHex, { network: NETWORKS.peercoin });
            const txLen = Buffer.from(validHex, 'hex').length;
            const prebuf = Buffer.alloc(txLen + 5, 0xaa);
            const result = tx.toBuffer(prebuf, 5);
            expect(result.length).toEqual(txLen);
            expect(result.toString('hex')).toEqual(validHex);
            expect(prebuf.subarray(0, 5).toString('hex')).toEqual('aaaaaaaaaa');
            expect(prebuf.subarray(5, 5 + txLen).toString('hex')).toEqual(validHex);
        });

        it('Dash: toBuffer with explicit non-zero initialOffset returns a subarray starting at that offset', () => {
            const validHex = fixturesDash.valid[0].hex;
            const tx = Transaction.fromHex(validHex, { network: NETWORKS.dashTest });
            const txLen = Buffer.from(validHex, 'hex').length;
            const prebuf = Buffer.alloc(txLen + 7, 0xbb);
            const result = tx.toBuffer(prebuf, 7);
            expect(result.length).toEqual(txLen);
            expect(result.toString('hex')).toEqual(validHex);
            expect(prebuf.subarray(0, 7).toString('hex')).toEqual('bbbbbbbbbbbbbb');
            expect(prebuf.subarray(7, 7 + txLen).toString('hex')).toEqual(validHex);
        });

        it('Dash: throws on Transaction has unexpected data when hex has trailing bytes', () => {
            const validHex = fixturesDash.valid[0].hex;
            const badHex = `${validHex}ff`;
            expect(() => Transaction.fromHex(badHex, { network: NETWORKS.dashTest })).toThrow(
                'Transaction has unexpected data',
            );
        });

        it('Dash: nostrict=true skips trailing-data check and returns the parsed transaction', () => {
            const validHex = fixturesDash.valid[0].hex;
            const badBuf = Buffer.from(`${validHex}ff`, 'hex');
            const tx = Transaction.fromBuffer(badBuf, {
                network: NETWORKS.dashTest,
                nostrict: true,
            });
            expect(tx.version).toEqual(fixturesDash.valid[0].raw.version);
            expect(tx.locktime).toEqual(fixturesDash.valid[0].raw.locktime);
            expect(tx.ins.length).toEqual(fixturesDash.valid[0].raw.ins.length);
            expect(tx.outs.length).toEqual(fixturesDash.valid[0].raw.outs.length);
        });

        it('Dash: throws on unsupported transaction type for version 3 (type > DASH_QUORUM_COMMITMENT)', () => {
            // Synthesized 4-byte hex: Int32LE 0x00070003 encodes version=3 (lower 16 bits)
            // and type=7 (upper 16 bits). Type 7 exceeds DASH_QUORUM_COMMITMENT=6, so dash.fromBuffer
            // throws before reading ins/outs/locktime — no further padding needed.
            const hex = '03000700';
            expect(() => Transaction.fromHex(hex, { network: NETWORKS.dashTest })).toThrow(
                'Unsupported Dash transaction type',
            );
        });

        it('Dash: byteLength() with no _ALLOW_WITNESS argument returns the serialized size', () => {
            const f = fixturesDash.valid[0];
            const tx = Transaction.fromHex(f.hex, { network: NETWORKS.dashTest });
            expect(tx.byteLength()).toEqual(f.size);
        });

        it('Dash: byteLength() with non-empty witness adds 2-byte segwit header and vector size', () => {
            // Exercises the hasWitnesses-truthy arms in src/transaction/dash.ts:18 (10 vs 8 header)
            // and :25 (witness reduce vs 0). A 1-byte witness element produces vectorSize = 3:
            // varuint.encodingLength(1) + varuint.encodingLength(1) + 1 = 1 + 1 + 1. Combined
            // with the +2 header delta, the total expected increase over the witness-less
            // baseline is 5 bytes for the single-input fixture.
            const f = fixturesDash.valid[0];
            const tx = Transaction.fromHex(f.hex, { network: NETWORKS.dashTest });
            const baseLen = tx.byteLength();
            tx.ins[0].witness = [Buffer.alloc(1)];
            expect(tx.byteLength()).toEqual(baseLen + 5);
        });

        it('Bitcoin: byteLength() with no _ALLOW_WITNESS/_ALLOW_MWEB arguments returns the serialized size', () => {
            // Bitcoin transactions inherit TransactionBase.prototype.byteLength (not overridden
            // by bitcoin.fromConstructor, unlike dash/decred/zcash), so calling tx.byteLength()
            // with no args exercises the default-arg branch at src/transaction/base.ts:118
            // (_ALLOW_WITNESS = true, _ALLOW_MWEB = true). For a non-witness tx, the result
            // equals the serialized byte length.
            const f = fixturesBitcoin.valid[0];
            const tx = Transaction.fromHex(f.hex);
            expect(tx.byteLength()).toEqual(Buffer.from(f.hex, 'hex').length);
        });

        it('Decred: throws on Transaction has unexpected data when hex has trailing bytes', () => {
            const validHex = fixturesDecred.valid[0].hex;
            const badHex = `${validHex}ff`;
            expect(() => Transaction.fromHex(badHex, { network: NETWORKS.decred })).toThrow(
                'Transaction has unexpected data',
            );
        });

        it('Decred: nostrict=true skips trailing-data check and returns the parsed transaction', () => {
            const validHex = fixturesDecred.valid[0].hex;
            const badBuf = Buffer.from(`${validHex}ff`, 'hex');
            const tx = Transaction.fromBuffer(badBuf, {
                network: NETWORKS.decred,
                nostrict: true,
            });
            expect(tx.version).toEqual(fixturesDecred.valid[0].raw.version);
            expect(tx.locktime).toEqual(fixturesDecred.valid[0].raw.locktime);
            expect(tx.ins.length).toEqual(fixturesDecred.valid[0].raw.ins.length);
            expect(tx.outs.length).toEqual(fixturesDecred.valid[0].raw.outs.length);
        });

        it('Decred: toBuffer with explicit non-zero initialOffset returns a subarray starting at that offset', () => {
            const validHex = fixturesDecred.valid[0].hex;
            const tx = Transaction.fromHex(validHex, { network: NETWORKS.decred });
            const txLen = Buffer.from(validHex, 'hex').length;
            const prebuf = Buffer.alloc(txLen + 9, 0xcc);
            const result = tx.toBuffer(prebuf, 9);
            expect(result.length).toEqual(txLen);
            expect(result.toString('hex')).toEqual(validHex);
            expect(prebuf.subarray(0, 9).toString('hex')).toEqual('cccccccccccccccccc');
            expect(prebuf.subarray(9, 9 + txLen).toString('hex')).toEqual(validHex);
        });

        it('Decred: getHash(forWitness=true) on a coinbase transaction returns 32 zero bytes', () => {
            const coinbaseFixture = fixturesDecred.valid[4];
            expect(coinbaseFixture.coinbase).toBe(true);
            const tx = Transaction.fromHex(coinbaseFixture.hex, { network: NETWORKS.decred });
            expect(tx.isCoinbase()).toBe(true);
            const witnessHash = tx.getHash(true);
            expect(witnessHash).toEqual(Buffer.alloc(32, 0));
        });

        it('Decred: throws on unsupported script version when output version byte is non-zero', () => {
            // Synthesized 15-byte hex driving decred.fromBuffer to the version!==DECRED_SCRIPT_VERSION
            // throw at decred.ts:149. Layout:
            //   bytes 0-3  '01000000' Int32LE → version=1, type=0 (DECRED_TX_SERIALIZE_FULL)
            //   byte 4     '00'                → vinLen varint = 0 (no inputs)
            //   byte 5     '01'                → voutLen varint = 1 (one output)
            //   bytes 6-13 '0000000000000000'  → output value uint64 LE = 0
            //   bytes 14-15'0100'              → output script version uint16 LE = 1
            // version=1 !== DECRED_SCRIPT_VERSION=0, so the throw fires before reading the script.
            const hex = '01000000000100000000000000000100';
            expect(() => Transaction.fromHex(hex, { network: NETWORKS.decred })).toThrow(
                'Unsupported Decred script version',
            );
        });

        it('Bitcoin: getHash(forWitness=true) on a coinbase transaction returns 32 zero bytes', () => {
            const coinbaseFixture = fixturesBitcoin.valid[3];
            expect(coinbaseFixture.coinbase).toBe(true);
            const tx = Transaction.fromHex(coinbaseFixture.hex);
            expect(tx.isCoinbase()).toBe(true);
            const witnessHash = tx.getHash(true);
            expect(witnessHash).toEqual(Buffer.alloc(32, 0));
        });

        it('Zcash: throws on Unexpected vSpendsSapling vector for an NU5 tx with non-empty vSpendsSapling varint', () => {
            // Synthesized 23-byte NU5 hex driving zcash.fromBuffer to the
            // `if (bufferReader.readVarInt() !== 0) throw 'Unexpected vSpendsSapling vector'`
            // branch at src/transaction/zcash.ts:606. Layout:
            //   bytes 0-3   '05000080' Int32LE → overwintered=1, version=5 (ZCASH_NU5_VERSION)
            //   bytes 4-7   '00000000'         → versionGroupId UInt32
            //   bytes 8-11  '00000000'         → consensusBranchId UInt32 (NU5-only)
            //   bytes 12-15 '00000000'         → locktime UInt32 (NU5-only)
            //   bytes 16-19 '00000000'         → expiry UInt32 (NU5-only)
            //   byte 20     '00'               → vinLen varint = 0 (no inputs)
            //   byte 21     '00'               → voutLen varint = 0 (no outputs)
            //   byte 22     '01'               → vSpendsSapling varint = 1 (non-zero → throws)
            // The throw fires before any vSpendsSapling element is read, so no further bytes
            // are required. For NU5, the sapling block at v===SAPLING(4) is skipped, the
            // joinsplits block (v < NU5) is skipped, and the bindingSig block requires
            // non-empty vShieldedSpend/vShieldedOutput which start empty.
            const hex = '0500008000000000000000000000000000000000000001';
            expect(() => Transaction.fromHex(hex, { network: NETWORKS.zcash })).toThrow(
                'Unexpected vSpendsSapling vector',
            );
        });

        it('Zcash: throws on Unexpected vOutputsSapling vector for an NU5 tx with non-empty vOutputsSapling varint', () => {
            // Synthesized 24-byte NU5 hex driving zcash.fromBuffer to the
            // `if (bufferReader.readVarInt() !== 0) throw 'Unexpected vOutputsSapling vector'`
            // branch at src/transaction/zcash.ts:610. Layout:
            //   bytes 0-3   '05000080' Int32LE → overwintered=1, version=5 (ZCASH_NU5_VERSION)
            //   bytes 4-7   '00000000'         → versionGroupId UInt32
            //   bytes 8-11  '00000000'         → consensusBranchId UInt32 (NU5-only)
            //   bytes 12-15 '00000000'         → locktime UInt32 (NU5-only)
            //   bytes 16-19 '00000000'         → expiry UInt32 (NU5-only)
            //   byte 20     '00'               → vinLen varint = 0 (no inputs)
            //   byte 21     '00'               → voutLen varint = 0 (no outputs)
            //   byte 22     '00'               → vSpendsSapling varint = 0 (passes first check)
            //   byte 23     '01'               → vOutputsSapling varint = 1 (non-zero → throws)
            // The throw fires immediately after readVarInt on vOutputsSapling, before any
            // element is read, so no further bytes are required.
            const hex = '050000800000000000000000000000000000000000000001';
            expect(() => Transaction.fromHex(hex, { network: NETWORKS.zcash })).toThrow(
                'Unexpected vOutputsSapling vector',
            );
        });

        it('Zcash: throws on Unexpected orchard byte for an NU5 tx with non-zero orchard byte', () => {
            // Synthesized 25-byte NU5 hex driving zcash.fromBuffer to the
            // `if (bufferReader.readUInt8() !== 0x00) throw 'Unexpected orchard byte'`
            // branch at src/transaction/zcash.ts:614. Layout:
            //   bytes 0-3   '05000080' Int32LE → overwintered=1, version=5 (ZCASH_NU5_VERSION)
            //   bytes 4-7   '00000000'         → versionGroupId UInt32
            //   bytes 8-11  '00000000'         → consensusBranchId UInt32 (NU5-only)
            //   bytes 12-15 '00000000'         → locktime UInt32 (NU5-only)
            //   bytes 16-19 '00000000'         → expiry UInt32 (NU5-only)
            //   byte 20     '00'               → vinLen varint = 0 (no inputs)
            //   byte 21     '00'               → voutLen varint = 0 (no outputs)
            //   byte 22     '00'               → vSpendsSapling varint = 0 (passes first check)
            //   byte 23     '00'               → vOutputsSapling varint = 0 (passes second check)
            //   byte 24     '01'               → orchard byte = 1 (non-zero → throws)
            // The throw fires immediately after readUInt8 on the orchard byte.
            const hex = '05000080000000000000000000000000000000000000000001';
            expect(() => Transaction.fromHex(hex, { network: NETWORKS.zcash })).toThrow(
                'Unexpected orchard byte',
            );
        });

        it('Zcash: throws on Transaction has unexpected data when hex has trailing bytes', () => {
            const validHex = fixturesZcash.valid[0].hex;
            const badHex = `${validHex}ff`;
            expect(() => Transaction.fromHex(badHex, { network: NETWORKS.zcash })).toThrow(
                'Transaction has unexpected data',
            );
        });

        it('Zcash: getHash on an empty NU5 tx routes getTransparentDigest through the no-ins-no-outs else arm', () => {
            // Synthesized 25-byte NU5 hex that parses cleanly as an empty NU5 transaction
            // (zero ins, zero outs, zero sapling spends/outputs, zero orchard byte). Layout:
            //   bytes 0-3   '05000080' Int32LE → overwintered=1, version=5 (ZCASH_NU5_VERSION)
            //   bytes 4-7   '00000000'         → versionGroupId UInt32
            //   bytes 8-11  '00000000'         → consensusBranchId UInt32 (NU5-only)
            //   bytes 12-15 '00000000'         → locktime UInt32 (NU5-only)
            //   bytes 16-19 '00000000'         → expiry UInt32 (NU5-only)
            //   byte 20     '00'               → vinLen varint = 0 (no inputs)
            //   byte 21     '00'               → voutLen varint = 0 (no outputs)
            //   byte 22     '00'               → vSpendsSapling varint = 0
            //   byte 23     '00'               → vOutputsSapling varint = 0
            //   byte 24     '00'               → orchard byte = 0
            // The resulting tx exercises src/transaction/zcash.ts:369
            //   `if (tx.ins.length || tx.outs.length)`
            // through its else arm: both `tx.ins.length` and `tx.outs.length` evaluate to 0,
            // the `||` short-circuit evaluates the right operand (since `tx.ins.length` is
            // falsy), and the if-condition is false → `buffer = Buffer.of()` at line 376 runs,
            // producing the empty-transparent-digest blake2b hash with personalization
            // 'ZTxIdTranspaHash'.
            const hex = '05000080000000000000000000000000000000000000000000';
            const tx = Transaction.fromHex(hex, { network: NETWORKS.zcash });
            expect(tx.ins.length).toBe(0);
            expect(tx.outs.length).toBe(0);
            const hash = tx.getHash();
            expect(Buffer.isBuffer(hash)).toBe(true);
            expect(hash.length).toBe(32);
            // Determinism: re-deriving the hash from the same tx yields the same 32-byte digest,
            // distinguishing the original else-arm (empty Buffer.of() input to ZTxIdTranspaHash)
            // from a mutant that forces the if-arm and feeds zero-filled prevouts/sequences/outputs
            // digests instead.
            expect(tx.getHash().toString('hex')).toEqual(hash.toString('hex'));
        });

        it('Zcash: nostrict=true skips trailing-data check and returns the parsed transaction', () => {
            const validHex = fixturesZcash.valid[0].hex;
            const badBuf = Buffer.from(`${validHex}ff`, 'hex');
            const tx = Transaction.fromBuffer(badBuf, {
                network: NETWORKS.zcash,
                nostrict: true,
            });
            expect(tx.version).toEqual(fixturesZcash.valid[0].raw.version);
            expect(tx.locktime).toEqual(fixturesZcash.valid[0].raw.locktime);
            expect(tx.ins.length).toEqual(fixturesZcash.valid[0].raw.ins.length);
            expect(tx.outs.length).toEqual(fixturesZcash.valid[0].raw.outs.length);
        });

        it('Zcash: toBuffer with explicit non-zero initialOffset returns a subarray starting at that offset', () => {
            const validHex = fixturesZcash.valid[0].hex;
            const tx = Transaction.fromHex(validHex, { network: NETWORKS.zcash });
            const txLen = Buffer.from(validHex, 'hex').length;
            const prebuf = Buffer.alloc(txLen + 11, 0xdd);
            const result = tx.toBuffer(prebuf, 11);
            expect(result.length).toEqual(txLen);
            expect(result.toString('hex')).toEqual(validHex);
            expect(prebuf.subarray(0, 11).toString('hex')).toEqual('dddddddddddddddddddddd');
            expect(prebuf.subarray(11, 11 + txLen).toString('hex')).toEqual(validHex);
        });

        it('Bitcoin: toBuffer with explicit non-zero initialOffset returns a subarray starting at that offset', () => {
            const validHex = fixturesBitcoin.valid[0].hex;
            const tx = Transaction.fromHex(validHex);
            const txLen = Buffer.from(validHex, 'hex').length;
            const prebuf = Buffer.alloc(txLen + 13, 0xee);
            const result = tx.toBuffer(prebuf, 13);
            expect(result.length).toEqual(txLen);
            expect(result.toString('hex')).toEqual(validHex);
            expect(prebuf.subarray(0, 13).toString('hex')).toEqual('eeeeeeeeeeeeeeeeeeeeeeeeee');
            expect(prebuf.subarray(13, 13 + txLen).toString('hex')).toEqual(validHex);
        });

        it('Bitcoin: nostrict=true skips trailing-data check and returns the parsed transaction', () => {
            const validHex = fixturesBitcoin.valid[0].hex;
            const badBuf = Buffer.from(`${validHex}ff`, 'hex');
            const tx = Transaction.fromBuffer(badBuf, { nostrict: true });
            expect(tx.version).toEqual(fixturesBitcoin.valid[0].raw.version);
            expect(tx.locktime).toEqual(fixturesBitcoin.valid[0].raw.locktime);
            expect(tx.ins.length).toEqual(fixturesBitcoin.valid[0].raw.ins.length);
            expect(tx.outs.length).toEqual(fixturesBitcoin.valid[0].raw.outs.length);
        });

        it('constructor with network=decred routes to decred.fromConstructor and overrides byteLength', () => {
            const tx = new Transaction({ network: NETWORKS.decred });
            expect(tx.network).toBe(NETWORKS.decred);
            // empty decred tx byteLength = 4 (version+type) + 1 (ins varint) + 1 (outs varint)
            // + 4 (block height) + 4 (block index) = 14.
            // base/bitcoin byteLength for an empty tx = 8 (version+locktime) + 1 + 1 = 10,
            // so a byteLength of 14 proves the decred-branch in the constructor ran.
            expect(tx.byteLength()).toBe(14);
        });

        it('constructor with network=zcash routes to zcash.fromConstructor and initializes zcash specific data', () => {
            const tx = new Transaction({ network: NETWORKS.zcash });
            expect(tx.network).toBe(NETWORKS.zcash);
            // zcash.fromConstructor initializes tx.specific to { type: 'zcash', ... }.
            // bitcoin.fromConstructor leaves tx.specific undefined, so asserting type==='zcash'
            // proves the zcash if-branch in the Transaction constructor ran instead of
            // falling through to bitcoin.fromConstructor.
            expect(tx.specific?.type).toBe('zcash');
        });

        it('Transaction.isCoinbaseHash returns true for a 32-byte all-zero buffer', () => {
            // The static Transaction.isCoinbaseHash delegates to base isCoinbaseHash; an
            // all-zero 32-byte prevout hash is the canonical coinbase marker.
            expect(Transaction.isCoinbaseHash(Buffer.alloc(32, 0))).toBe(true);
        });
    });

    describe('toBuffer/toHex', () => {
        fixturesBitcoin.valid.forEach(f => {
            it(`exports ${f.description} (${f.id})`, () => {
                const actual = utils.fromRaw(f.raw, { noWitness: true });
                expect(actual.toHex()).toEqual(f.hex);
            });

            if (f.whex) {
                it(`exports ${f.description} (${f.id}) as witness`, () => {
                    const wactual = utils.fromRaw(f.raw);
                    expect(wactual.toHex()).toEqual(f.whex);
                });
            }
        });

        fixturesBitcoinCash.valid.forEach(f => {
            it(`exports ${f.description}`, () => {
                const actual = utils.fromRaw(f.raw, { network: NETWORKS.bitcoincash });
                expect(actual.toHex()).toEqual(f.hex);
            });
        });

        fixturesDash.valid.forEach(f => {
            it(`Dash: exports ${f.description}`, () => {
                const actual = utils.fromRaw(f.raw, {
                    network: NETWORKS.dashTest,
                    txSpecific: {
                        type: 'dash',
                        extraPayload: f.raw.extraPayload
                            ? Buffer.from(f.raw.extraPayload, 'hex')
                            : undefined,
                    },
                });
                actual.type = f.raw.type;
                expect(actual.toHex()).toEqual(f.hex);
            });
        });

        fixturesDoge.valid.forEach(f => {
            it(`Doge: exports ${f.description} (${f.hash})`, () => {
                const actual = utils.fromRaw(f.raw);
                expect(actual.toHex()).toEqual(f.hex);
            });
        });

        fixturesPeercoin.valid.forEach(f => {
            it(`Peercoin: exports ${f.description} (${f.hash})`, () => {
                const actual = utils.fromRaw(f.raw, { network: NETWORKS.peercoin });
                actual.timestamp = f.raw.timestamp;
                expect(actual.toHex()).toEqual(f.hex);
            });
        });

        fixturesLitecoin.valid.forEach(f => {
            it(`Litecoin: exports ${f.description} (${f.hash})`, () => {
                const actual = utils.fromRaw(f.raw, { network: NETWORKS.litecoin });
                expect(actual.toHex()).toEqual(f.hex);
            });
        });

        // TODO: decred, zcash, komodo
    });

    describe('hasWitnesses', () => {
        fixturesBitcoin.valid.forEach(f => {
            it(`detects if the transaction has witnesses: ${f.whex ? 'true' : 'false'}`, () => {
                const tx = Transaction.fromHex(f.whex || f.hex);
                expect(tx.hasWitnesses()).toEqual(!!f.whex);
            });
        });

        fixturesDecred.valid.forEach(f => {
            it(`detects if Decred transaction has witnesses: ${
                f.raw.type !== 1 ? 'true' : 'false'
            }`, () => {
                const tx = Transaction.fromHex(f.hex, {
                    network: utils.getNetwork(f.network),
                });
                expect(tx.hasWitnesses()).toEqual(f.raw.type !== 1);
            });
        });
    });

    describe('getWitness', () => {
        fixturesBitcoin.valid.forEach(f => {
            it(`get tx witnesses: ${f.whex ? 'true' : 'false'}`, () => {
                const tx = Transaction.fromHex(f.whex || f.hex);
                if (f.whex) {
                    tx.ins.forEach((input, i) => {
                        const witness = tx.getWitness(i);
                        const length = input.witness.reduce((l, w) => l + w.length + 1, 1);
                        expect(witness!.length).toBe(length);
                    });
                } else {
                    tx.ins.forEach((_, i) => expect(tx.getWitness(i)).toBe(undefined));
                }
            });
        });
    });

    describe('weight/virtualSize', () => {
        [
            ...fixturesBitcoin.valid,
            ...fixturesBitcoinCash.valid,
            ...fixturesDash.valid,
            ...fixturesDoge.valid,
            ...fixturesDecred.valid,
            ...fixturesPeercoin.valid,
            ...fixturesKomodo.valid,
            ...fixturesZcash.valid,
            ...fixturesLitecoin.valid,
        ].forEach((f: utils.Fixture) => {
            it(f.description, () => {
                const tx = Transaction.fromHex(f.whex || f.hex, {
                    network: utils.getNetwork(f.network),
                });
                expect(tx.weight()).toEqual(f.weight);
                expect(tx.virtualSize()).toEqual(f.virtualSize);
            });
        });
    });

    describe('getHash/getId', () => {
        [
            ...fixturesBitcoin.valid,
            ...fixturesBitcoinCash.valid,
            ...fixturesDash.valid,
            ...fixturesDoge.valid,
            ...fixturesDecred.valid,
            ...fixturesPeercoin.valid,
            ...fixturesKomodo.valid,
            ...fixturesZcash.valid,
            ...fixturesLitecoin.valid,
        ].forEach((f: utils.Fixture) => {
            it(`should return the id for ${f.id}(${f.description})`, () => {
                const tx = Transaction.fromHex(f.whex || f.hex, {
                    network: utils.getNetwork(f.network),
                });
                expect(tx.getHash().toString('hex')).toEqual(f.hash);
                expect(tx.getId()).toEqual(f.id);
            });
        });
    });

    describe('isCoinbase', () => {
        [
            ...fixturesBitcoin.valid,
            ...fixturesBitcoinCash.valid,
            ...fixturesDash.valid,
            ...fixturesDoge.valid,
            ...fixturesDecred.valid,
            ...fixturesPeercoin.valid,
            ...fixturesKomodo.valid,
            ...fixturesZcash.valid,
        ].forEach((f: utils.Fixture) => {
            it(`should return ${f.coinbase} for ${f.id}(${f.description})`, () => {
                const tx = Transaction.fromHex(f.hex, {
                    network: utils.getNetwork(f.network),
                });
                expect(tx.isCoinbase()).toEqual(f.coinbase);
            });
        });
    });

    describe('getExtraData', () => {
        fixturesDash.valid.forEach(f => {
            it(`Dash: imports ${f.description}`, () => {
                const tx = Transaction.fromHex(f.hex, { network: NETWORKS.dashTest });
                const extraData = tx.getExtraData();
                expect(extraData?.toString('hex')).toEqual(f.extraData);
            });
        });

        fixturesZcash.valid.forEach(f => {
            it(`Zcash: ${f.description}`, () => {
                const tx = Transaction.fromHex(f.hex, { network: NETWORKS.zcash });
                const extraData = tx.getExtraData();
                expect(extraData?.toString('hex')).toEqual(f.extraData);
            });
        });
    });

    describe('getSpecificData', () => {
        fixturesDash.valid.forEach(f => {
            it(`Dash: ${f.description}`, () => {
                const tx = Transaction.fromHex(f.hex, { network: NETWORKS.dashTest });
                const specificData = tx.getSpecificData();
                if (specificData?.type !== 'dash') throw Error('not a dash tx');
                expect(specificData.extraPayload?.toString('hex')).toEqual(f.raw.extraPayload);
            });
        });

        fixturesZcash.valid.forEach(f => {
            it(`Zcash: ${f.description}`, () => {
                const tx = Transaction.fromHex(f.hex, { network: NETWORKS.zcash });
                const specificData = tx.getSpecificData();
                if (specificData?.type !== 'zcash') throw Error('not a zcash tx');
                expect(specificData.versionGroupId).toEqual(
                    typeof f.raw.versionGroupId === 'number'
                        ? f.raw.versionGroupId
                        : parseInt(f.raw.versionGroupId, 16),
                );
                expect(specificData.overwintered).toEqual(f.raw.overwintered);
                expect(specificData.joinsplits.length).toEqual(f.raw.joinsplitsLength);
                expect(specificData.joinsplitPubkey.length).toEqual(f.raw.joinsplitPubkeyLength);
                expect(specificData.joinsplitSig.length).toEqual(f.raw.joinsplitSigLength);

                if (f.raw.valueBalance) {
                    expect(specificData.valueBalance).toEqual(f.raw.valueBalance);
                }
                if (f.raw.nShieldedSpend) {
                    const shieldedSpend = specificData.vShieldedSpend;
                    for (let i = 0; i < f.raw.nShieldedSpend; ++i) {
                        expect(shieldedSpend[i].cv.toString('hex')).toEqual(
                            f.raw.vShieldedSpend[i].cv,
                        );
                        expect(shieldedSpend[i].anchor.toString('hex')).toEqual(
                            f.raw.vShieldedSpend[i].anchor,
                        );
                        expect(shieldedSpend[i].nullifier.toString('hex')).toEqual(
                            f.raw.vShieldedSpend[i].nullifier,
                        );
                        expect(shieldedSpend[i].rk.toString('hex')).toEqual(
                            f.raw.vShieldedSpend[i].rk,
                        );
                        expect(
                            shieldedSpend[i].zkproof.sA.toString('hex') +
                                shieldedSpend[i].zkproof.sB.toString('hex') +
                                shieldedSpend[i].zkproof.sC.toString('hex'),
                        ).toEqual(f.raw.vShieldedSpend[i].zkproof);
                        expect(shieldedSpend[i].spendAuthSig.toString('hex')).toEqual(
                            f.raw.vShieldedSpend[i].spendAuthSig,
                        );
                    }
                }
            });
        });
    });
});
