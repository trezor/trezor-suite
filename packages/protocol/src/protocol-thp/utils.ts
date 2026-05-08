import { type ThpMessageSyncBit, ThpPairingMethod } from './messages';
import { THP_CONTROL_BYTE } from '../protocol-v2/constants';

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

// clear 4th (ack) and 5th (sequence) bit
export const clearControlBit = (magic: number) => magic & ~(1 << 3) & ~(1 << 4);

export const getControlBit = (magic: number) => {
    const ackBit: ThpMessageSyncBit = (magic & (1 << 3)) === 0 ? 0 : 1;
    const sequenceBit: ThpMessageSyncBit = (magic & (1 << 4)) === 0 ? 0 : 1;

    return { ackBit, sequenceBit };
};

// transform protocol-v2 message header to ThpHeader object
export const readThpHeader = (bytes: Buffer) => {
    // 1 byte
    const magic = bytes.readUInt8();
    // sequence bit
    const { ackBit, sequenceBit } = getControlBit(magic);
    // 2 bytes channel id
    const channel = bytes.subarray(1, 3);

    return {
        magic: clearControlBit(magic),
        ackBit,
        sequenceBit,
        channel,
    };
};

// check if ThpAck is send/expected by Trezor
// Trezor doesn't send ThpAck after ThpCreateChannelRequest
// Trezor doesn't expect ThpAck ThpCreateChannelResponse
export const isAckExpected = (bytesOrMagic: Buffer | number[]) => {
    const isCreateChannelMessage = (magic: number) =>
        [THP_CONTROL_BYTE.CHANNEL_ALLOCATION_REQ, THP_CONTROL_BYTE.CHANNEL_ALLOCATION_RES].includes(
            magic,
        );

    if (Array.isArray(bytesOrMagic)) {
        return !bytesOrMagic.some(isCreateChannelMessage);
    }

    return !isCreateChannelMessage(bytesOrMagic.readUInt8());
};

// get expected responses from decoded request data
export const getExpectedResponses = (bytes: Buffer) => {
    const { magic } = readThpHeader(bytes);

    if (magic === THP_CONTROL_BYTE.CHANNEL_ALLOCATION_REQ) {
        return [THP_CONTROL_BYTE.CHANNEL_ALLOCATION_RES];
    }
    if (magic === THP_CONTROL_BYTE.HANDSHAKE_INIT_REQ) {
        return [THP_CONTROL_BYTE.HANDSHAKE_INIT_RES];
    }
    if (magic === THP_CONTROL_BYTE.HANDSHAKE_COMP_REQ) {
        return [THP_CONTROL_BYTE.HANDSHAKE_COMP_RES];
    }
    if (magic === THP_CONTROL_BYTE.ENCRYPTED) {
        return [THP_CONTROL_BYTE.ENCRYPTED];
    }

    return [];
};

export const isThpMessageName = (name: string) =>
    [
        'ThpCreateChannelRequest',
        'ThpHandshakeInitRequest',
        'ThpHandshakeCompletionRequest',
        'ThpAck',
    ].includes(name);

export const getThpPairingMethod = (dm: ThpPairingMethod | keyof typeof ThpPairingMethod) =>
    typeof dm === 'string' ? ThpPairingMethod[dm] : dm;
