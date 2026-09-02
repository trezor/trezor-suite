import * as NETWORKS from '../networks';
import fixturesBitcoin from './__fixtures__/bitcoin';
import fixturesBitcoinCash from './__fixtures__/bitcoinCash';
import fixturesDoge from './__fixtures__/doge';
import fixturesKomodo from './__fixtures__/komodo';
import fixturesLitecoin from './__fixtures__/litecoin';
import * as utils from './__fixtures__/transaction.utils';
import fixturesZcash from './__fixtures__/zcash';

import { Transaction } from './index';

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

        fixturesDoge.valid.forEach(importExport);

        fixturesKomodo.valid.forEach(importExport);

        fixturesZcash.valid.forEach(importExport);

        fixturesLitecoin.valid.forEach(importExport);

        it('.version should be interpreted as an int32le', () => {
            const txHex = 'ffffffff0000ffffffff';
            const tx = Transaction.fromHex(txHex);
            expect(tx.version).toEqual(-1);
            expect(tx.locktime).toEqual(0xffffffff);
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

        fixturesDoge.valid.forEach(f => {
            it(`Doge: exports ${f.description} (${f.hash})`, () => {
                const actual = utils.fromRaw(f.raw);
                expect(actual.toHex()).toEqual(f.hex);
            });
        });

        fixturesLitecoin.valid.forEach(f => {
            it(`Litecoin: exports ${f.description} (${f.hash})`, () => {
                const actual = utils.fromRaw(f.raw, { network: NETWORKS.litecoin });
                expect(actual.toHex()).toEqual(f.hex);
            });
        });

        // TODO: zcash, komodo
    });

    describe('hasWitnesses', () => {
        fixturesBitcoin.valid.forEach(f => {
            it(`detects if the transaction has witnesses: ${f.whex ? 'true' : 'false'}`, () => {
                const tx = Transaction.fromHex(f.whex || f.hex);
                expect(tx.hasWitnesses()).toEqual(!!f.whex);
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
            ...fixturesDoge.valid,
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
            ...fixturesDoge.valid,
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
            ...fixturesDoge.valid,
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
        fixturesZcash.valid.forEach(f => {
            it(`Zcash: ${f.description}`, () => {
                const tx = Transaction.fromHex(f.hex, { network: NETWORKS.zcash });
                const extraData = tx.getExtraData();
                expect(extraData?.toString('hex')).toEqual(f.extraData);
            });
        });
    });

    describe('getSpecificData', () => {
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
                    const expectedShieldedSpend = f.raw.vShieldedSpend;
                    for (let i = 0; i < f.raw.nShieldedSpend; ++i) {
                        // @ts-expect-error: indexing with noUncheckedIndexedAccess
                        const spend: (typeof shieldedSpend)[number] = shieldedSpend[i];
                        // @ts-expect-error: indexing with noUncheckedIndexedAccess
                        const expected: (typeof expectedShieldedSpend)[number] =
                            expectedShieldedSpend[i];
                        expect(spend.cv.toString('hex')).toEqual(expected.cv);
                        expect(spend.anchor.toString('hex')).toEqual(expected.anchor);
                        expect(spend.nullifier.toString('hex')).toEqual(expected.nullifier);
                        expect(spend.rk.toString('hex')).toEqual(expected.rk);
                        expect(
                            spend.zkproof.sA.toString('hex') +
                                spend.zkproof.sB.toString('hex') +
                                spend.zkproof.sC.toString('hex'),
                        ).toEqual(expected.zkproof);
                        expect(spend.spendAuthSig.toString('hex')).toEqual(expected.spendAuthSig);
                    }
                }
            });
        });
    });
});
