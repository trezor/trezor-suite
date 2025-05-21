import type { ThpState } from './ThpState';
import {
    THP_CONTINUATION_PACKET,
    THP_CREATE_CHANNEL_REQUEST,
    THP_CREATE_CHANNEL_RESPONSE,
    THP_ERROR_HEADER_BYTE,
} from './constants';
import type { ThpMessageSyncBit } from './messages';

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

export const getControlBit = (magic: number): ThpMessageSyncBit => {
    const ackBit = (magic & (1 << 3)) === 0 ? 0 : 1;
    const sequenceBit = (magic & (1 << 4)) === 0 ? 0 : 1;

    return ackBit || sequenceBit;
};

// transform protocol-v2 message header to ThpHeader object
export const readThpHeader = (bytes: Buffer) => {
    // 1 byte
    const magic = bytes.readUInt8();
    // sequence bit
    const controlBit = getControlBit(magic);
    // 2 bytes channel id
    const channel = bytes.subarray(1, 3);

    return {
        magic,
        controlBit,
        channel,
    };
};

// check if ThpAck is send/expected by Trezor
// Trezor doesn't send ThpAck after ThpCreateChannelRequest
// Trezor doesn't expect ThpAck ThpCreateChannelResponse
export const isAckExpected = (bytesOrMagic: Buffer | number[]) => {
    const isCreateChannelMessage = (magic: number) =>
        [THP_CREATE_CHANNEL_REQUEST, THP_CREATE_CHANNEL_RESPONSE].includes(magic);

    if (Array.isArray(bytesOrMagic)) {
        return !bytesOrMagic.find(n => isCreateChannelMessage(n));
    }

    return !isCreateChannelMessage(bytesOrMagic.readUInt8());
};

// get expected responses from decoded request data
export const getExpectedResponses = (bytes: Buffer) => {
    const header = readThpHeader(bytes);
    const magic = clearControlBit(header.magic);

    if (magic === THP_CREATE_CHANNEL_REQUEST) {
        return [THP_CREATE_CHANNEL_RESPONSE];
    }

    return [];
};

export const isExpectedResponse = (bytes: Buffer, state: ThpState) => {
    if (bytes.length < 3) {
        // ignore messages with minimum info
        return false;
    }

    const header = readThpHeader(bytes);
    if (header.channel.compare(state.channel) !== 0) {
        // ignore messages from different channels
        return false;
    }

    const magic = clearControlBit(header.magic);
    if (magic === THP_ERROR_HEADER_BYTE) {
        // ThpError is always expected
        return true;
    }

    const { expectedResponses } = state;
    for (let i = 0; i < expectedResponses.length; i++) {
        if (magic === expectedResponses[i]) {
            // continuation packet is not masked by controlBit
            if (magic !== THP_CONTINUATION_PACKET && header.controlBit !== state?.recvBit) {
                console.warn('Unexpected control bit');

                return false;
            }

            return true;
        }
    }

    return false;
};

export const isThpMessageName = (name: string) =>
    [
        'ThpCreateChannelRequest',
        'ThpHandshakeInitRequest',
        'ThpHandshakeCompletionRequest',
        'ThpReadAck',
    ].includes(name);
