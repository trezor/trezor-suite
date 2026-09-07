import { address, networks } from '../src';
import { BufferWriter, varIntSize } from '../src/bufferutils';
import { PSBT_MAGIC, Psbt } from '../src/psbt';
import { PSBT_FIXTURES } from './__fixtures__/psbt';

const UNSIGNED_TX_KEY = Buffer.from([0x00]);
const MAP_SEPARATOR = Buffer.from([0x00]);

// Unsigned transaction (empty scriptSig) as required by BIP-174 for the PSBT global tx.
const TX_HEX =
    '0100000001f1fefefefefefefefefefefefefefefefefefefefefefefefefefefefefefefe0000000000ffffffff01a0860100000000001976a914c42e7ef92fdb603af844d064faad95db9bcdfd3d88ac00000000';

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
        expect(reparsed.unsignedTx.outs[1]?.value).toEqual('500');
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
        const missingUnsignedTx = Buffer.concat([PSBT_MAGIC, MAP_SEPARATOR]);

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

    it('throws on invalid magic bytes', () => {
        expect(() => Psbt.fromBuffer(Buffer.from('0000000000', 'hex'))).toThrow(
            'Invalid PSBT magic bytes.',
        );
    });

    it('throws on a duplicate key within a map', () => {
        // global map with two identical key/value entries (key 0x0102, value 0x03)
        const duplicateKeyMap = Buffer.concat([PSBT_MAGIC, Buffer.from('02010201030201020103', 'hex')]);

        expect(() => Psbt.fromBuffer(duplicateKeyMap)).toThrow('PSBT map has duplicate key.');
    });

    it('throws when there are more PSBT input maps than unsigned transaction inputs', () => {
        const psbt = Psbt.fromHex(getSimplePsbtBuffer(TX_HEX).toString('hex'));

        psbt.inputs.push([]);

        expect(() => psbt.toBuffer()).toThrow(
            'PSBT has more input maps than unsigned transaction inputs.',
        );
    });

    it('rejects an oversized key length without allocating', () => {
        // key length varint claims 0xffffffff bytes but none follow → bounded read must throw
        const oversized = Buffer.concat([PSBT_MAGIC, Buffer.from('feffffffff', 'hex')]);

        expect(() => Psbt.fromBuffer(oversized)).toThrow();
    });
});
