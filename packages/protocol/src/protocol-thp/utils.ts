import type { ThpState } from './ThpState';
import { ThpMessageSyncBit, ThpPairingMethod } from './messages';
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
        return !bytesOrMagic.find(n => isCreateChannelMessage(n));
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
        return [THP_CONTROL_BYTE.HANDSHAKE_INIT_RES, THP_CONTROL_BYTE.CONTINUATION_PACKET];
    }
    if (magic === THP_CONTROL_BYTE.HANDSHAKE_COMP_REQ) {
        return [THP_CONTROL_BYTE.HANDSHAKE_COMP_RES, THP_CONTROL_BYTE.CONTINUATION_PACKET];
    }
    if (magic === THP_CONTROL_BYTE.ENCRYPTED) {
        return [THP_CONTROL_BYTE.ENCRYPTED, THP_CONTROL_BYTE.CONTINUATION_PACKET];
    }

    return [];
};

// get expected responses from ThpState (stored as numbers)
// and join them with the channel to receive 3 bytes header
export const getExpectedHeaders = (state: ThpState): Buffer[] =>
    [...state.expectedResponses, THP_CONTROL_BYTE.ERROR] // error could be sent any time
        .map(resp => {
            switch (resp) {
                case THP_CONTROL_BYTE.CONTINUATION_PACKET:
                    return Buffer.from([resp]); // THP_CONTROL_BYTE.CONTINUATION_PACKET is not masked with sequence bit
                case THP_CONTROL_BYTE.ACK_MESSAGE:
                    return addAckBit(resp, state.sendAckBit);
                default:
                    return addSequenceBit(resp, state.recvBit);
            }
        })
        .map(magic => Buffer.concat([magic, state.channel]));

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

    const { magic } = header;
    if (magic === THP_CONTROL_BYTE.ERROR) {
        // ThpError is always expected
        return true;
    }

    const { expectedResponses } = state;
    for (let i = 0; i < expectedResponses.length; i++) {
        if (magic === expectedResponses[i]) {
            // continuation packet is not masked by controlBit
            if (
                magic !== THP_CONTROL_BYTE.CONTINUATION_PACKET &&
                (header.sequenceBit !== state?.recvBit || header.ackBit !== state?.recvAckBit)
            ) {
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

export const getThpPairingMethod = (dm: ThpPairingMethod | keyof typeof ThpPairingMethod) =>
    typeof dm === 'string' ? ThpPairingMethod[dm] : dm;
