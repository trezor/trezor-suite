import { addAckBit, addSequenceBit, clearControlBit, getControlBit } from './utils';

describe('controlBit', () => {
    it('ackBit', () => {
        expect(addAckBit(0x20, 0).readUint8()).toEqual(0x20);
        expect(addAckBit(0x20, 1).readUint8()).toEqual(0x28);
        expect(addAckBit(0x04, 1).readUint8()).toEqual(0x0c);
        expect(addAckBit(0x14, 1).readUint8()).toEqual(0x1c); // with sequenceBit

        expect(getControlBit(0x20).ackBit).toEqual(0);
        expect(getControlBit(0x28).ackBit).toEqual(1);
        expect(getControlBit(0x0c).ackBit).toEqual(1);
        expect(getControlBit(0x1c).ackBit).toEqual(1); // with sequenceBit

        expect(clearControlBit(0x20)).toEqual(0x20);
        expect(clearControlBit(0x28)).toEqual(0x20);
        expect(clearControlBit(0x1c)).toEqual(0x04); // with sequenceBit
    });

    it('sequenceBit', () => {
        expect(addSequenceBit(0x03, 0).readUint8()).toEqual(0x03);
        expect(addSequenceBit(0x03, 1).readUint8()).toEqual(0x13);
        expect(addSequenceBit(0x0c, 1).readUint8()).toEqual(0x1c); // with ackBit

        expect(getControlBit(0x03).sequenceBit).toEqual(0);
        expect(getControlBit(0x13).sequenceBit).toEqual(1);
        expect(getControlBit(0x0c).sequenceBit).toEqual(0); // with ackBit
        expect(getControlBit(0x1c).sequenceBit).toEqual(1); // with ackBit and sequenceBit

        expect(clearControlBit(0x03)).toEqual(0x03);
        expect(clearControlBit(0x13)).toEqual(0x03);
        expect(clearControlBit(0x1c)).toEqual(0x04); // with ackBit
    });
});
