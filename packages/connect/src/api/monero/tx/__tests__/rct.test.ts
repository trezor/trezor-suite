import {
    type Clsag,
    type RctSigBase,
    type RctSigPrunable,
    RctType,
    writeRctSigBase,
    writeRctSigPrunable,
} from '../rct';
import { ByteWriter } from '../serialize';

const key = (fill: number) => new Uint8Array(32).fill(fill);
const ecdh = (fill: number) => new Uint8Array(8).fill(fill);
const clsag = (ringSize: number): Clsag => ({
    s: Array.from({ length: ringSize }, (_, i) => key(i)),
    c1: key(0xc1),
    D: key(0xdd),
});

// The size guards are the only defense that the device-returned arrays match the prefix dimensions
// before an outgoing tx is serialized, so each one is exercised directly.
describe('rct serialization size guards', () => {
    it('rejects ecdhInfo/outPk count != number of outputs', () => {
        const base: RctSigBase = {
            type: RctType.BulletproofPlus,
            txnFee: 1n,
            ecdhInfo: [ecdh(1)], // 1 entry for 2 outputs
            outPk: [key(1), key(2)],
        };
        expect(() =>
            writeRctSigBase(new ByteWriter(), base, { inputs: 1, outputs: 2, mixin: 15 }),
        ).toThrow('rct base ecdhInfo/outPk size must equal number of outputs');
    });

    it('rejects CLSAG count != number of inputs', () => {
        const prunable: RctSigPrunable = {
            bulletproofsPlus: [],
            clsags: [clsag(16)], // 1 CLSAG for 2 inputs
            pseudoOuts: [key(1), key(2)],
        };
        expect(() =>
            writeRctSigPrunable(new ByteWriter(), prunable, {
                type: RctType.BulletproofPlus,
                inputs: 2,
                outputs: 2,
                mixin: 15,
            }),
        ).toThrow('rct prunable CLSAGs size must equal number of inputs');
    });

    it('rejects a CLSAG whose scalar count != ring size (mixin + 1)', () => {
        const prunable: RctSigPrunable = {
            bulletproofsPlus: [],
            clsags: [clsag(15)], // 15 scalars for ring size 16
            pseudoOuts: [key(1)],
        };
        expect(() =>
            writeRctSigPrunable(new ByteWriter(), prunable, {
                type: RctType.BulletproofPlus,
                inputs: 1,
                outputs: 2,
                mixin: 15,
            }),
        ).toThrow('CLSAG.s size must equal ring size (mixin + 1)');
    });

    it('rejects pseudoOuts count != number of inputs', () => {
        const prunable: RctSigPrunable = {
            bulletproofsPlus: [],
            clsags: [clsag(16)],
            pseudoOuts: [], // 0 for 1 input
        };
        expect(() =>
            writeRctSigPrunable(new ByteWriter(), prunable, {
                type: RctType.BulletproofPlus,
                inputs: 1,
                outputs: 2,
                mixin: 15,
            }),
        ).toThrow('rct prunable pseudoOuts size must equal number of inputs');
    });
});
