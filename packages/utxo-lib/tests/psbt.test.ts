import * as varuint from 'varuint-bitcoin';

import { address, networks } from '../src';
import { Psbt } from '../src/psbt';
import { PSBT_FIXTURES } from './__fixtures__/psbt';

const MAGIC = Buffer.from('70736274ff', 'hex');
const UNSIGNED_TX_KEY = Buffer.from([0x00]);

const TX_HEX =
    '0100000001f1fefefefefefefefefefefefefefefefefefefefefefefefefefefefefefefe000000006b4830450221008732a460737d956fd94d49a31890b2908f7ed7025a9c1d0f25e43290f1841716022004fa7d608a291d44ebbbebbadaac18f943031e7de39ef3bf9920998c43e60c0401210279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798ffffffff01a0860100000000001976a914c42e7ef92fdb603af844d064faad95db9bcdfd3d88ac00000000';

function toVarSlice(buffer: Buffer) {
    const len = varuint.encodingLength(buffer.length);
    const out = Buffer.allocUnsafe(len + buffer.length);
    varuint.encode(buffer.length, out, 0);
    buffer.copy(out, len);

    return out;
}

function getMapSeparator() {
    return Buffer.from([0x00]);
}

function getSimplePsbtBuffer(unsignedTxHex: string) {
    const unsignedTx = Buffer.from(unsignedTxHex, 'hex');

    const globalUnsignedTx = Buffer.concat([toVarSlice(UNSIGNED_TX_KEY), toVarSlice(unsignedTx)]);

    return Buffer.concat([
        MAGIC,
        globalUnsignedTx,
        getMapSeparator(),
        getMapSeparator(),
        getMapSeparator(),
    ]);
}

describe('Psbt', () => {
    it.each(PSBT_FIXTURES)('$description', ({ hex, inputCount, outputCount, source }) => {
        const psbt = Psbt.fromHex(hex);

        expect(psbt.inputs).toHaveLength(inputCount);
        expect(psbt.outputs).toHaveLength(outputCount);
        expect(psbt.unsignedTx.ins).toHaveLength(inputCount);
        expect(psbt.unsignedTx.outs).toHaveLength(outputCount);
        expect(psbt.toHex()).toEqual(hex);

        expect(source).toBeTruthy();
    });

    it('parses a minimal synthetic PSBT and extracts unsigned transaction', () => {
        const psbtHex = getSimplePsbtBuffer(TX_HEX).toString('hex');

        const psbt = Psbt.fromHex(psbtHex);

        expect(psbt.unsignedTx.toHex()).toEqual(TX_HEX);
        expect(psbt.inputs).toHaveLength(1);
        expect(psbt.outputs).toHaveLength(1);
        expect(psbt.toHex()).toEqual(psbtHex);
    });

    it('serializes current unsigned transaction state after mutation', () => {
        const psbtHex = getSimplePsbtBuffer(TX_HEX).toString('hex');
        const psbt = Psbt.fromHex(psbtHex);

        psbt.unsignedTx.locktime = 123;

        const reparsed = Psbt.fromBuffer(psbt.toBuffer());

        expect(reparsed.unsignedTx.locktime).toEqual(123);
        expect(reparsed.inputs).toHaveLength(1);
        expect(reparsed.outputs).toHaveLength(1);
    });

    it('serializes added unsigned transaction outputs with empty PSBT output maps', () => {
        const psbtHex = getSimplePsbtBuffer(TX_HEX).toString('hex');
        const psbt = Psbt.fromHex(psbtHex);

        psbt.unsignedTx.outs.push({
            value: '500',
            script: address.toOutputScript('1JAd7XCBzGudGpJQSDSfpmJhiygtLQWaGL', networks.bitcoin),
        });

        const reparsed = Psbt.fromBuffer(psbt.toBuffer(), { network: networks.bitcoin });

        expect(reparsed.unsignedTx.outs).toHaveLength(2);
        expect(reparsed.outputs).toHaveLength(2);
        expect(reparsed.outputs[1]).toEqual([]);
        expect(reparsed.unsignedTx.outs[1].value).toEqual('500');
    });

    it('throws when there are more PSBT output maps than unsigned transaction outputs', () => {
        const psbtHex = getSimplePsbtBuffer(TX_HEX).toString('hex');
        const psbt = Psbt.fromHex(psbtHex);

        psbt.outputs.push([]);

        expect(() => psbt.toBuffer()).toThrow(
            'PSBT has more output maps than unsigned transaction outputs.',
        );
    });

    it('throws when global map is missing unsigned transaction', () => {
        const missingUnsignedTx = Buffer.concat([MAGIC, getMapSeparator()]);

        expect(() => Psbt.fromBuffer(missingUnsignedTx)).toThrow(
            'PSBT must contain exactly one unsigned transaction.',
        );
    });

    it('throws on trailing data in strict mode', () => {
        const psbtBuffer = Buffer.concat([getSimplePsbtBuffer(TX_HEX), Buffer.from([0xaa])]);

        expect(() => Psbt.fromBuffer(psbtBuffer)).toThrow('PSBT has unexpected data.');
    });

    it('allows trailing data with nostrict', () => {
        const psbtBuffer = Buffer.concat([getSimplePsbtBuffer(TX_HEX), Buffer.from([0xaa])]);

        const psbt = Psbt.fromBuffer(psbtBuffer, { nostrict: true });

        expect(psbt.unsignedTx.toHex()).toEqual(TX_HEX);
    });
});
