import { ThpMessageSyncBit } from './messages';

export const addAckBit = (magic: number, ackBit: number) => {
    const result = Buffer.alloc(1);
    result.writeInt8(magic | (ackBit << 3));

    return result;
};

export const addSequenceBit = (magic: number, seqBit: number) => {
    const result = Buffer.alloc(1);
    result.writeInt8(magic | (seqBit << 4));

    return result;
};

export const clearControlBit = (magic: number) => {
    // clear 4th (ack) and 5th (sequence) bit
    return magic & ~(1 << 3) & ~(1 << 4);
};

export const getControlBit = (magic: number): ThpMessageSyncBit => {
    const ackBit = (magic & (1 << 3)) === 0 ? 0 : 1;
    const sequenceBit = (magic & (1 << 4)) === 0 ? 0 : 1;

    return ackBit || sequenceBit;
};

export const getIvFromNonce = (nonce: number): Buffer => {
    const iv = new Uint8Array(12);
    const nonceBytes = new Uint8Array(8);
    for (let i = 0; i < 8; i++) {
        nonceBytes[7 - i] = nonce & 0xff;
        nonce = nonce >> 8;
    }
    iv.set(nonceBytes, 4);

    return Buffer.from(iv);
};
