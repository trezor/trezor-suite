import { address, networks } from '../src';
import { BufferWriter, varIntSize } from '../src/bufferutils';
import { PSBT_MAGIC, Psbt } from '../src/psbt';
import { PSBT_FIXTURES } from './__fixtures__/psbt';

const UNSIGNED_TX_KEY = Buffer.from([0x00]);
const MAP_SEPARATOR = Buffer.from([0x00]);

const UNSIGNED_TX_HEX =
    '0200000001ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000000000ffffffff010000000000000000036a010000000000';
const SIGNED_TX_HEX =
    '0200000001ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000000100ffffffff010000000000000000036a010000000000';
const WITNESS_TX_HEX =
    '02000000000101ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000000000ffffffff010000000000000000036a0101010000000000';

function toVarSlice(buffer: Buffer) {
    const out = Buffer.allocUnsafe(varIntSize(buffer.length) + buffer.length);
    const writer = new BufferWriter(out);
    writer.writeVarSlice(buffer);

    return out;
}

function getSimplePsbtBuffer(unsignedTxHex: string) {
    const unsignedTx = Buffer.from(unsignedTxHex, 'hex');

    const globalUnsignedTx = Buffer.concat([toVarSlice(UNSIGNED_TX_KEY), toVarSlice(unsignedTx)]);

    return Buffer.concat([
        PSBT_MAGIC,
        globalUnsignedTx,
        MAP_SEPARATOR,
        MAP_SEPARATOR,
        MAP_SEPARATOR,
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
        const psbtHex = getSimplePsbtBuffer(UNSIGNED_TX_HEX).toString('hex');

        const psbt = Psbt.fromHex(psbtHex);

        expect(psbt.unsignedTx.toHex()).toEqual(UNSIGNED_TX_HEX);
        expect(psbt.inputs).toHaveLength(1);
        expect(psbt.outputs).toHaveLength(1);
        expect(psbt.toHex()).toEqual(psbtHex);
    });

    it('serializes current unsigned transaction state after mutation', () => {
        const psbtHex = getSimplePsbtBuffer(UNSIGNED_TX_HEX).toString('hex');
        const psbt = Psbt.fromHex(psbtHex);

        psbt.unsignedTx.locktime = 123;

        const reparsed = Psbt.fromBuffer(psbt.toBuffer());

        expect(reparsed.unsignedTx.locktime).toEqual(123);
        expect(reparsed.inputs).toHaveLength(1);
        expect(reparsed.outputs).toHaveLength(1);
    });

    it('serializes added unsigned transaction outputs with empty PSBT output maps', () => {
        const psbtHex = getSimplePsbtBuffer(UNSIGNED_TX_HEX).toString('hex');
        const psbt = Psbt.fromHex(psbtHex);

        psbt.unsignedTx.outs.push({
            value: '500',
            script: address.toOutputScript('1JAd7XCBzGudGpJQSDSfpmJhiygtLQWaGL', networks.bitcoin),
        });

        const reparsed = Psbt.fromBuffer(psbt.toBuffer(), { network: networks.bitcoin });

        expect(reparsed.unsignedTx.outs).toHaveLength(2);
        expect(reparsed.outputs).toHaveLength(2);
        expect(reparsed.outputs[1]).toEqual([]);
        expect(reparsed.unsignedTx.outs[1]?.value).toEqual('500');
    });

    it('throws when there are more PSBT output maps than unsigned transaction outputs', () => {
        const psbtHex = getSimplePsbtBuffer(UNSIGNED_TX_HEX).toString('hex');
        const psbt = Psbt.fromHex(psbtHex);

        psbt.outputs.push([]);

        expect(() => psbt.toBuffer()).toThrow(
            'PSBT has more output maps than unsigned transaction outputs.',
        );
    });

    it('throws when global map is missing unsigned transaction', () => {
        const missingUnsignedTx = Buffer.concat([PSBT_MAGIC, MAP_SEPARATOR]);

        expect(() => Psbt.fromBuffer(missingUnsignedTx)).toThrow(
            'PSBT must contain exactly one unsigned transaction.',
        );
    });

    it('throws when unsigned transaction contains scriptSigs', () => {
        const psbtBuffer = getSimplePsbtBuffer(SIGNED_TX_HEX);

        expect(() => Psbt.fromBuffer(psbtBuffer)).toThrow(
            'PSBT unsigned transaction must not contain scriptSigs.',
        );
    });

    it('throws when unsigned transaction contains witnesses', () => {
        const psbtBuffer = getSimplePsbtBuffer(WITNESS_TX_HEX);

        expect(() => Psbt.fromBuffer(psbtBuffer)).toThrow(
            'PSBT unsigned transaction must not contain witnesses.',
        );
    });

    it('throws on trailing data in strict mode', () => {
        const psbtBuffer = Buffer.concat([
            getSimplePsbtBuffer(UNSIGNED_TX_HEX),
            Buffer.from([0xaa]),
        ]);

        expect(() => Psbt.fromBuffer(psbtBuffer)).toThrow('PSBT has unexpected data.');
    });

    it('allows trailing data with nostrict', () => {
        const psbtBuffer = Buffer.concat([
            getSimplePsbtBuffer(UNSIGNED_TX_HEX),
            Buffer.from([0xaa]),
        ]);

        const psbt = Psbt.fromBuffer(psbtBuffer, { nostrict: true });

        expect(psbt.unsignedTx.toHex()).toEqual(UNSIGNED_TX_HEX);
    });
});
