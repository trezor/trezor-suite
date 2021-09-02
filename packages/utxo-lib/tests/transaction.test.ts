import { Transaction } from '../src/transaction';
import * as NETWORKS from '../src/networks';
import * as utils from './transaction.utils';
import fixturesBitcoin from './__fixtures__/transaction/bitcoin';
import fixturesBitcoinCash from './__fixtures__/transaction/bitcoinCash';
import fixturesDash from './__fixtures__/transaction/dash';
import fixturesDecred from './__fixtures__/transaction/decred';
import fixturesDoge from './__fixtures__/transaction/doge';
import fixturesKomodo from './__fixtures__/transaction/komodo';
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
