import {
    CRC_LENGTH,
    TAG_LENGTH,
    THP_CREATE_CHANNEL_REQUEST,
    THP_CREATE_CHANNEL_RESPONSE,
    THP_HANDSHAKE_INIT_REQUEST,
    THP_HANDSHAKE_INIT_RESPONSE,
    THP_HANDSHAKE_COMPLETION_REQUEST,
    THP_HANDSHAKE_COMPLETION_RESPONSE,
    THP_READ_ACK_HEADER_BYTE,
    THP_CONTROL_BYTE_DECRYPTED,
    THP_CONTROL_BYTE_ENCRYPTED,
    THP_ERROR_HEADER_BYTE,
    THP_CONTINUATION_PACKET,
} from './constants';
import { ThpMessageType } from './messages';
import { handleCreateChannelResponse, getTrezorState } from './crypto/pairing';
import { getIvFromNonce } from './crypto/tools';
import { aesgcm, crc32 } from './crypto';
import { getControlBit, clearControlBit } from './utils';
import { ThpProtocolState } from './ThpProtocolState';
import { TransportProtocolDecode } from '../types';

type ThpMessage = ReturnType<TransportProtocolDecode> & {
    magic: number;
    protocolState: ThpProtocolState;
};

type ThpDecodedMessage = {
    messageName: keyof ThpMessageType;
    payload: Buffer;
    length: number;
    message: Record<string, any>;
    sessionId: number;
};

const decipherMessage = (
    key: Buffer,
    recvNonce: number,
    _handshakeHash: Buffer,
    payload: Buffer,
    tag: Buffer,
) => {
    const aes = aesgcm(key, getIvFromNonce(recvNonce));
    aes.auth(Buffer.alloc(0));
    const trezorMaskedStaticPubkey = aes.decrypt(payload, tag);

    return trezorMaskedStaticPubkey.subarray(1); // NOTE: remove session_id (first byte)
};

const createChannelRequest = ({ payload }: ThpMessage): ThpDecodedMessage => {
    const nonce = payload.subarray(0, 8);

    return {
        messageName: 'ThpCreateChannelRequest',
        payload: nonce,
        length: nonce.length,
        message: {},
        sessionId: 0,
    };
};

const createChannelResponse = (
    { payload, length }: ThpMessage,
    protobufDecoder: ProtobufDecoder,
): ThpDecodedMessage => {
    const nonce = payload.subarray(0, 8);
    const channel = payload.subarray(8, 10);
    const props = payload.subarray(10, payload.length - CRC_LENGTH);
    const properties = protobufDecoder('ThpDeviceProperties', props).message;
    const handshakeHash = handleCreateChannelResponse(props);

    return {
        messageName: 'ThpCreateChannelResponse',
        payload,
        length,
        message: {
            nonce,
            channel,
            properties,
            handshakeHash,
        },
        sessionId: 0,
    };
};

const readAck = (): ThpDecodedMessage => {
    return {
        messageName: 'ThpReadAck',
        payload: Buffer.alloc(0),
        length: 0,
        message: {
            ack: true,
        },
        sessionId: 0,
    };
};

// TODO: this should not be here
const readHandshakeInitRequest = ({ payload, length }: ThpMessage): ThpDecodedMessage => {
    const key = payload.subarray(0, TAG_LENGTH);
    const tag = payload.subarray(TAG_LENGTH, TAG_LENGTH * 2);

    return {
        messageName: 'ThpHandshakeInitRequest',
        payload,
        length,
        message: {
            key,
            tag,
        },
        sessionId: 0,
    };
};

const readHandshakeInitResponse = ({ payload, length }: ThpMessage): ThpDecodedMessage => {
    const trezorEphemeralPubkey = payload.subarray(0, 32);
    const trezorEncryptedStaticPubkey = payload.subarray(32, 32 + 48);
    const tag = payload.subarray(32 + 48, 32 + 48 + TAG_LENGTH);

    return {
        messageName: 'ThpHandshakeInitResponse',
        payload,
        length,
        message: {
            trezorEphemeralPubkey,
            trezorEncryptedStaticPubkey,
            tag,
        },
        sessionId: 0,
    };
};

const readHandshakeCompletionRequest = ({ payload, length }: ThpMessage): ThpDecodedMessage => {
    return {
        messageName: 'ThpHandshakeCompletionRequest',
        payload,
        length,
        message: {
            key: payload.subarray(0, TAG_LENGTH),
        },
        sessionId: 0,
    };
};

const readHandshakeCompletionResponse = ({
    payload,
    length,
    protocolState,
}: ThpMessage): ThpDecodedMessage => {
    const state = getTrezorState(protocolState.handshakeCredentials!, payload);

    return {
        messageName: 'ThpHandshakeCompletionResponse',
        payload,
        length,
        message: {
            state,
            // tag: payload.subarray(1, TAG_LENGTH),
        },
        sessionId: 0,
    };
};

const readProtobufMessage = (
    { length, payload, protocolState }: ThpMessage,
    protobufDecoder: ProtobufDecoder,
): ThpDecodedMessage => {
    const sessionId = payload.readUint8();
    const tagPos = payload.length - TAG_LENGTH - CRC_LENGTH;
    const cipheredMessage = payload.subarray(0, tagPos);
    const tag = payload.subarray(tagPos, payload.length - CRC_LENGTH);
    const decipheredMessage = decipherMessage(
        protocolState.handshakeCredentials!.trezorKey,
        protocolState.recvNonce,
        protocolState.handshakeCredentials!.handshakeHash,
        cipheredMessage,
        tag,
    );

    const messageType1 = decipheredMessage.readUInt16BE(0);
    const messagePayload = decipheredMessage.subarray(2);

    const proto = protobufDecoder(messageType1, messagePayload);

    return {
        // type overflow is not exactly true but we don't know real proto definitions here
        messageName: proto.messageName as keyof ThpMessageType,
        payload: messagePayload,
        length: length - (1 + 2 + TAG_LENGTH + CRC_LENGTH),
        message: proto.message,
        sessionId,
    };
};

const readThpError = ({ payload, length, protocolState }: ThpMessage): ThpDecodedMessage => {
    // https://www.notion.so/satoshilabs/THP-Specification-d17010749c254977889660ec158e675c?pvs=4#856900b6b8544b589559cbf2e120a8a9
    const [errorType] = payload;
    let error;
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
        messageName: 'ThpError',
        message,
        payload,
        length,
        sessionId: protocolState.sessionId,
    };
};

type ProtobufDecoder = (
    protobufMessageType: string | number,
    protobufPayload: Buffer,
) => {
    messageName: string;
    message: Record<string, any>;
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
    protocolState?: ThpProtocolState,
): ThpDecodedMessage => {
    if (!protocolState) {
        throw new Error('Cannot decode THP message without protocolState');
    }

    validateCrc(decodedMessage);

    const header = readHeader(decodedMessage.header);
    const message: ThpMessage = {
        ...decodedMessage,
        ...header,
        protocolState,
    };

    const magic = clearControlBit(message.magic);

    if (magic === THP_ERROR_HEADER_BYTE) {
        return readThpError(message);
    }

    if (magic === THP_CREATE_CHANNEL_REQUEST) {
        return createChannelRequest(message);
    }

    if (magic === THP_CREATE_CHANNEL_RESPONSE) {
        return createChannelResponse(message, protobufDecoder);
    }

    if (magic === THP_READ_ACK_HEADER_BYTE) {
        return readAck();
    }

    if (magic === THP_HANDSHAKE_INIT_REQUEST) {
        return readHandshakeInitRequest(message);
    }

    if (magic === THP_HANDSHAKE_INIT_RESPONSE) {
        return readHandshakeInitResponse(message);
    }

    if (magic === THP_HANDSHAKE_COMPLETION_REQUEST) {
        return readHandshakeCompletionRequest(message);
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
    const isCreateChannelMessage = (magic: number) => {
        return [THP_CREATE_CHANNEL_REQUEST, THP_CREATE_CHANNEL_RESPONSE].includes(magic);
    };

    if (Array.isArray(bytesOrMagic)) {
        return !bytesOrMagic.find(n => isCreateChannelMessage(n));
    }

    return !isCreateChannelMessage(bytesOrMagic.readUInt8());
};

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

export const isExpectedResponse = (bytes: Buffer, protocolState?: ThpProtocolState) => {
    if (bytes.length < 3) return false;

    const header = readHeader(bytes);
    const magic = clearControlBit(header.magic);
    const expectedResponses = protocolState?.expectedResponses || [];

    if (header.channel.compare(protocolState!.channel) !== 0) {
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

            if (header.controlBit !== protocolState?.recvBit) {
                console.warn('TODO: Unexpected control bit');
                // TODO: should it throw? should it ignore? should it abaddon and recreate channel?
                // throw new Error('TODO: Unexpected control bit');
            }

            return bytes;
        }
    }
};
