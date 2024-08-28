import { ThpState } from './ThpState';
import {
    CRC_LENGTH,
    TAG_LENGTH,
    THP_CONTINUATION_PACKET,
    THP_CONTROL_BYTE_DECRYPTED,
    THP_CONTROL_BYTE_ENCRYPTED,
    THP_CREATE_CHANNEL_REQUEST,
    THP_CREATE_CHANNEL_RESPONSE,
    THP_ERROR_HEADER_BYTE,
    THP_HANDSHAKE_COMPLETION_REQUEST,
    THP_HANDSHAKE_COMPLETION_RESPONSE,
    THP_HANDSHAKE_INIT_REQUEST,
    THP_HANDSHAKE_INIT_RESPONSE,
    THP_READ_ACK_HEADER_BYTE,
} from './constants';
import { aesgcm, crc32 } from './crypto';
import { TransportProtocolDecode } from '../types';
import { getTrezorState, handleCreateChannelResponse } from './crypto/pairing';
import { getIvFromNonce } from './crypto/tools';
import { MessageResponse } from './messages';
import { clearControlBit, getControlBit } from './utils';

type ThpMessage = ReturnType<TransportProtocolDecode> & {
    magic: number;
    thpState: ThpState;
};

// @trezor/protobuf decodeMessage without direct reference to
// messages (protobuf root) and return type
type ProtobufDecoder = (
    messageType: string | number,
    payload: Buffer,
) => {
    type: string;
    message: Record<string, unknown>;
};

const decipherMessage = (key: Buffer, recvNonce: number, payload: Buffer, tag: Buffer) => {
    const aes = aesgcm(key, getIvFromNonce(recvNonce));
    aes.auth(Buffer.alloc(0));
    const trezorMaskedStaticPubkey = aes.decrypt(payload, tag);

    return trezorMaskedStaticPubkey.subarray(1); // NOTE: remove session_id (first byte)
};

const createChannelResponse = (
    { payload }: ThpMessage,
    protobufDecoder: ProtobufDecoder,
): MessageResponse => {
    const nonce = payload.subarray(0, 8);
    const channel = payload.subarray(8, 10);
    const props = payload.subarray(10, payload.length - CRC_LENGTH);
    const properties = protobufDecoder('ThpDeviceProperties', props).message;
    const handshakeHash = handleCreateChannelResponse(props);

    return {
        type: 'ThpCreateChannelResponse',
        message: {
            nonce,
            channel,
            properties,
            handshakeHash,
        },
    } as any;
};

const readAck = (): MessageResponse => ({
    type: 'ThpReadAck',
    message: {
        ack: true,
    },
});

const readHandshakeInitResponse = ({ payload }: ThpMessage): MessageResponse => {
    const trezorEphemeralPubkey = payload.subarray(0, 32);
    const trezorEncryptedStaticPubkey = payload.subarray(32, 32 + 48);
    const tag = payload.subarray(32 + 48, 32 + 48 + TAG_LENGTH);

    return {
        type: 'ThpHandshakeInitResponse',
        message: {
            trezorEphemeralPubkey,
            trezorEncryptedStaticPubkey,
            tag,
        } as any,
    };
};

const readHandshakeCompletionResponse = ({ payload, thpState }: ThpMessage): MessageResponse => {
    const state = getTrezorState(thpState.handshakeCredentials!, payload);

    return {
        type: 'ThpHandshakeCompletionResponse',
        message: {
            state,
            // tag: payload.subarray(1, TAG_LENGTH),
        },
    } as any;
};

const readProtobufMessage = (
    { payload, thpState }: ThpMessage,
    protobufDecoder: ProtobufDecoder,
): MessageResponse => {
    const tagPos = payload.length - TAG_LENGTH - CRC_LENGTH;
    const cipheredMessage = payload.subarray(0, tagPos);
    const tag = payload.subarray(tagPos, payload.length - CRC_LENGTH);
    const decipheredMessage = decipherMessage(
        thpState.handshakeCredentials!.trezorKey,
        thpState.recvNonce,
        cipheredMessage,
        tag,
    );

    const messageType = decipheredMessage.readUInt16BE(0);
    const messagePayload = decipheredMessage.subarray(2);

    return protobufDecoder(messageType, messagePayload) as MessageResponse;
};

const readThpError = ({ payload }: ThpMessage): MessageResponse => {
    // https://www.notion.so/satoshilabs/THP-Specification-d17010749c254977889660ec158e675c?pvs=4#856900b6b8544b589559cbf2e120a8a9
    const [errorType] = payload;
    let error = 'ThpUnknownError';
    if (errorType === 0x01) {
        error = 'ThpTransportBusy';
    }
    if (errorType === 0x02) {
        error = 'ThpUnallocatedSession';
    }
    if (errorType === 0x03) {
        error = 'ThpDecryptionFailed';
    }

    const message = {
        code: error,
        message: error ?? `Unknown ThpError ${errorType}`,
    };

    return {
        type: 'ThpError',
        message,
    };
};

const readHeader = (bytes: Buffer) => {
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

const validateCrc = (decodedMessage: ReturnType<TransportProtocolDecode>) => {
    const payloadLenWithoutCrc = decodedMessage.payload.length - CRC_LENGTH;
    const length = Buffer.alloc(2);
    length.writeUInt16BE(decodedMessage.length);

    const expectedCrc = crc32(
        Buffer.concat([
            decodedMessage.header,
            length,
            decodedMessage.payload.subarray(0, payloadLenWithoutCrc),
        ]),
    );
    const crc = decodedMessage.payload.subarray(payloadLenWithoutCrc);

    if (expectedCrc.compare(crc) !== 0) {
        throw new Error(
            `Invalid CRC. expected: ${expectedCrc.toString('hex')} received: ${crc.toString('hex')}`,
        );
    }
};

export const decodeAck = (decodedMessage: ReturnType<TransportProtocolDecode>) => {
    validateCrc(decodedMessage);
    const header = readHeader(decodedMessage.header);
    const magic = clearControlBit(header.magic);
    if (magic === THP_READ_ACK_HEADER_BYTE) {
        return readAck();
    } else {
        return false;
    }
};

// Decode message received by protocol-v2
export const decode = (
    decodedMessage: ReturnType<TransportProtocolDecode>,
    protobufDecoder: ProtobufDecoder,
    thpState?: ThpState,
): MessageResponse => {
    if (!thpState) {
        throw new Error('Cannot decode THP message without ThpState');
    }

    validateCrc(decodedMessage);

    const header = readHeader(decodedMessage.header);
    const message: ThpMessage = {
        ...decodedMessage,
        ...header,
        thpState,
    };

    const magic = clearControlBit(message.magic);

    if (magic === THP_ERROR_HEADER_BYTE) {
        return readThpError(message);
    }

    if (magic === THP_CREATE_CHANNEL_RESPONSE) {
        return createChannelResponse(message, protobufDecoder);
    }

    if (magic === THP_READ_ACK_HEADER_BYTE) {
        return readAck();
    }

    if (magic === THP_HANDSHAKE_INIT_RESPONSE) {
        return readHandshakeInitResponse(message);
    }

    if (magic === THP_HANDSHAKE_COMPLETION_RESPONSE) {
        return readHandshakeCompletionResponse(message);
    }

    if (magic === THP_CONTROL_BYTE_ENCRYPTED) {
        return readProtobufMessage(message, protobufDecoder);
    }

    if (magic === THP_CONTROL_BYTE_DECRYPTED) {
        console.warn('TODO: Decoding decrypted message');

        return readProtobufMessage(message, protobufDecoder);
    }

    throw new Error('Unknown message type: ' + magic);
};

export const isAckExpected = (bytesOrMagic: Buffer | number[]) => {
    const isCreateChannelMessage = (magic: number) =>
        [THP_CREATE_CHANNEL_REQUEST, THP_CREATE_CHANNEL_RESPONSE].includes(magic);

    if (Array.isArray(bytesOrMagic)) {
        return !bytesOrMagic.find(n => isCreateChannelMessage(n));
    }

    return !isCreateChannelMessage(bytesOrMagic.readUInt8());
};

// get expected response from the current request
export const getExpectedResponse = (bytes: Buffer) => {
    const header = readHeader(bytes);
    const magic = clearControlBit(header.magic);

    if (magic === THP_CREATE_CHANNEL_REQUEST) {
        return [THP_CREATE_CHANNEL_RESPONSE];
    }
    if (magic === THP_HANDSHAKE_INIT_REQUEST) {
        return [THP_HANDSHAKE_INIT_RESPONSE, THP_CONTINUATION_PACKET];
    }
    if (magic === THP_HANDSHAKE_COMPLETION_REQUEST) {
        return [THP_HANDSHAKE_COMPLETION_RESPONSE, THP_CONTINUATION_PACKET];
    }
    if (magic === THP_CONTROL_BYTE_ENCRYPTED) {
        return [THP_CONTROL_BYTE_ENCRYPTED, THP_CONTINUATION_PACKET];
    }
    if (magic === THP_CONTROL_BYTE_DECRYPTED) {
        return [THP_CONTROL_BYTE_DECRYPTED, THP_CONTINUATION_PACKET];
    }

    return []; // TODO: should throw error?
};

export const isExpectedResponse = (bytes: Buffer, state?: ThpState) => {
    if (bytes.length < 3) return false;

    const header = readHeader(bytes);
    const magic = clearControlBit(header.magic);
    const expectedResponses = state?.expectedResponses || [];

    if (header.channel.compare(state!.channel) !== 0) {
        // ignore messages from different channels
        return false;
    }

    if (magic === THP_ERROR_HEADER_BYTE) {
        return true;
    }

    for (let i = 0; i < expectedResponses.length; i++) {
        if (magic === expectedResponses[i]) {
            if (magic === THP_CONTINUATION_PACKET) {
                return true;
            }

            if (header.controlBit !== state?.recvBit) {
                console.warn('TODO: Unexpected control bit');
                // TODO: should it throw? should it ignore? should it abaddon and recreate channel?
                // throw new Error('TODO: Unexpected control bit');
            }

            return bytes;
        }
    }
};
