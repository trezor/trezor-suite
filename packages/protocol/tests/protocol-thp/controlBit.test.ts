import {
    addSequenceBit,
    addAckBit,
    clearControlBit,
    getControlBit,
} from '../../src/protocol-thp/utils';

describe('controlBit', () => {
    it('ackBit', () => {
        expect(addAckBit(0x20, 0).readUint8()).toEqual(0x20);
        expect(addAckBit(0x20, 1).readUint8()).toEqual(0x28);

        expect(getControlBit(0x20)).toEqual(0);
        expect(getControlBit(0x28)).toEqual(1);

        expect(clearControlBit(0x20)).toEqual(0x20);
        expect(clearControlBit(0x28)).toEqual(0x20);
    });

    it('sequenceBit', () => {
        expect(addSequenceBit(0x03, 0).readUint8()).toEqual(0x03);
        expect(addSequenceBit(0x03, 1).readUint8()).toEqual(0x13);

        expect(getControlBit(0x03)).toEqual(0);
        expect(getControlBit(0x13)).toEqual(1);

        expect(clearControlBit(0x03)).toEqual(0x03);
        expect(clearControlBit(0x13)).toEqual(0x03);
    });
});
