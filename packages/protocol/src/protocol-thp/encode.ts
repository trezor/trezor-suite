import {
    CRC_LENGTH,
    TAG_LENGTH,
    THP_CREATE_CHANNEL_REQUEST,
    THP_HANDSHAKE_INIT_REQUEST,
    THP_HANDSHAKE_COMPLETION_REQUEST,
    THP_DEFAULT_CHANNEL,
    THP_READ_ACK_HEADER_BYTE,
    THP_CONTROL_BYTE_ENCRYPTED,
    THP_CONTROL_BYTE_DECRYPTED,
} from './constants';
import { aesgcm, crc32 } from './crypto';
import { handleHandshakeCompletionResponse } from './crypto/pairing';
import { getIvFromNonce } from './crypto/tools';
import { addSequenceBit, addAckBit, getControlBit } from './utils';
import { ThpProtocolState } from './ThpProtocolState';
import { validateThpMessageName } from './validation';

const cipherMessage = (key: Buffer, sendNonce: number, handshakeHash: Buffer, payload: Buffer) => {
    // Set encrypted_payload = AES-GCM-ENCRYPT(key=k, IV=0^96, ad=h, plaintext=payload_binary).
    const aes = aesgcm(key, getIvFromNonce(sendNonce));
    aes.auth(handshakeHash);
    const encryptedPayload = aes.encrypt(payload);
    const encryptedPayloadTag = aes.finish();

    return Buffer.concat([encryptedPayload, encryptedPayloadTag]);
};

const getBytesFromField = (data: Record<string, unknown>, fieldName: string) => {
    const value = data[fieldName];
    if (typeof value === 'string') {
        return Buffer.from(value, 'hex');
    }
    if (Buffer.isBuffer(value)) {
        return value;
    }
};

const createChannelRequestPayload = (data: Record<string, unknown>) => {
    const nonce = getBytesFromField(data, 'nonce');
    if (!nonce) {
        throw new Error('ThpCreateChannelRequest missing nonce field');
    }

    return nonce;
};

const handshakeInitRequestPayload = (
    data: Record<string, unknown>,
    _protocolState: ThpProtocolState,
) => {
    const key = getBytesFromField(data, 'key');
    if (!key) {
        throw new Error('ThpHandshakeInitRequest missing key field');
    }

    return key;
};

const handshakeCompletionRequestPayload = (
    data: Record<string, unknown>,
    protobufEncoder: ProtobufEncoder,
    protocolState: ThpProtocolState,
) => {
    const hostPubkey = getBytesFromField(data, 'hostPubkey');
    if (!hostPubkey) {
        throw new Error('ThpHandshakeCompletionRequest missing hostPubkey field');
    }
    if (!data.noise) {
        throw new Error('ThpHandshakeCompletionRequest missing noise field');
    }
    if (!protocolState?.handshakeCredentials) {
        throw new Error('ThpHandshakeCompletionRequest missing handshakeCredentials field');
    }

    const { payload } = protobufEncoder('ThpHandshakeCompletionReqNoisePayload', data.noise);
    const { handshakeHash, hostKey } = protocolState.handshakeCredentials;

    const cipheredMessage = cipherMessage(hostKey, protocolState.sendNonce, handshakeHash, payload);
    // TODO: this should not be here, move level up
    protocolState.updateHandshakeCredentials(
        handleHandshakeCompletionResponse(protocolState.handshakeCredentials, payload),
    );

    return Buffer.concat([hostPubkey, cipheredMessage]);
};

type ProtobufEncoder = (
    messageName: any, // string | number
    messageData: any, //Record<string, unknown>,
) => {
    messageType: number;
    payload: Buffer;
};

export const encodePayload = (
    name: string,
    data: Record<string, unknown>,
    protobufEncoder: ProtobufEncoder,
    protocolState: ThpProtocolState,
) => {
    if (name === 'ThpCreateChannelRequest') {
        return createChannelRequestPayload(data);
    }
    if (name === 'ThpHandshakeInitRequest') {
        return handshakeInitRequestPayload(data, protocolState);
    }
    if (name === 'ThpHandshakeCompletionRequest') {
        return handshakeCompletionRequestPayload(data, protobufEncoder, protocolState);
    }

    // TODO: ? throw new Error(`Unknown Thp message type ${name}`);
    return Buffer.alloc(0);
};

// protocol-v2

const createChannelRequest = (data: Buffer, channel: Buffer) => {
    const length = Buffer.alloc(2);
    length.writeUInt16BE(data.length + CRC_LENGTH); // 8 nonce + 4 crc

    const magic = Buffer.from([THP_CREATE_CHANNEL_REQUEST]);
    const message = Buffer.concat([magic, channel, length, data]);
    const crc = crc32(message);

    return Buffer.concat([message, crc]);
};

const handshakeInitRequest = (data: Buffer, channel: Buffer) => {
    const length = Buffer.alloc(2);
    length.writeUInt16BE(data.length + CRC_LENGTH);

    const magic = Buffer.from([THP_HANDSHAKE_INIT_REQUEST]);
    const message = Buffer.concat([magic, channel, length, data]);
    const crc = crc32(message);

    return Buffer.concat([message, crc]);
};

const handshakeCompletionRequest = (data: Buffer, channel: Buffer, sendBit: number) => {
    const length = Buffer.alloc(2);
    length.writeUInt16BE(data.length + CRC_LENGTH);

    const magic = addSequenceBit(THP_HANDSHAKE_COMPLETION_REQUEST, sendBit);
    const message = Buffer.concat([magic, channel, length, data]);
    const crc = crc32(message);

    return Buffer.concat([message, crc]);
};

const ack = (channel: Buffer, syncBit: number) => {
    const length = Buffer.alloc(2);
    length.writeUInt16BE(CRC_LENGTH);

    const magic = addAckBit(THP_READ_ACK_HEADER_BYTE, syncBit);
    const message = Buffer.concat([magic, channel, length]);
    const crc = crc32(message);

    return Buffer.concat([message, crc]);
};

const encodeThpMessage = (
    messageType: string,
    data: Buffer,
    channel: Buffer,
    protocolState: ThpProtocolState,
    header: Buffer,
) => {
    // message decoded by protocol-v2 but not by protocol-thp (bridge-node case)
    if (messageType === 'TrezorHostProtocolMessage') {
        const length = Buffer.alloc(2);
        length.writeUInt16BE(data.length);

        return Buffer.concat([header, length, data]);
    }

    if (messageType === 'ThpCreateChannelRequest') {
        return createChannelRequest(data, channel);
    }

    if (messageType === 'ThpHandshakeInitRequest') {
        return handshakeInitRequest(data, channel);
    }

    if (messageType === 'ThpHandshakeCompletionRequest') {
        return handshakeCompletionRequest(data, channel, protocolState.sendBit || 0);
    }

    throw new Error(`Unknown Thp message type ${messageType}`);
};

export const encodeProtobufMessage = (
    messageType: number,
    data: Buffer,
    channel: Buffer,
    protocolState?: ThpProtocolState,
) => {
    if (!protocolState) {
        throw new Error('cannot encode without protocolState');
    }

    const length = Buffer.alloc(2);
    length.writeUInt16BE(1 + 2 + data.length + TAG_LENGTH + CRC_LENGTH); // 1 session_id + 2 messageType + protobuf len + 16 tag + 4 crc

    // TODO: distinguish encrypted(fw) and decrypted(bootloader) messages
    const magic = addSequenceBit(
        THP_CONTROL_BYTE_ENCRYPTED || THP_CONTROL_BYTE_DECRYPTED,
        protocolState.sendBit,
    );
    const header = Buffer.concat([magic, channel]);

    const mt = Buffer.alloc(2);
    const session_id = Buffer.alloc(1);
    session_id.writeInt8(protocolState.sessionId);

    mt.writeUInt16BE(messageType);

    const cipheredMessage = cipherMessage(
        protocolState.handshakeCredentials!.hostKey,
        protocolState.sendNonce,
        Buffer.alloc(0),
        Buffer.concat([session_id, mt, data]),
    );
    const message = Buffer.concat([header, length, cipheredMessage]);
    const crc = crc32(message);

    return Buffer.concat([message, crc]);
};

// encode data generated by protocol-thp
export const encode = (options: {
    data: Record<string, any>;
    messageType: number | string;
    protocolState?: ThpProtocolState;
    protobufEncoder: ProtobufEncoder;
    header?: Buffer; // TODO: this is used by bridge?
}) => {
    if (!options.protocolState) {
        throw new Error('Cannot encode THP message without protocolState');
    }

    const channel = options.protocolState.channel || THP_DEFAULT_CHANNEL;
    const { messageType, protobufEncoder, protocolState } = options;

    let result: Buffer;
    if (typeof messageType === 'string' && validateThpMessageName(messageType)) {
        const payload = encodePayload(messageType, options.data, protobufEncoder, protocolState);
        result = encodeThpMessage(
            messageType,
            payload,
            channel,
            options.protocolState,
            Buffer.alloc(3), // header
        );
    } else {
        const { messageType: mt, payload } = protobufEncoder(messageType, options.data);
        result = encodeProtobufMessage(mt, payload, channel, options.protocolState);
    }

    return result;
};

export const encodeAck = (bytesOrState: Buffer | ThpProtocolState) => {
    if (Buffer.isBuffer(bytesOrState)) {
        // 1 byte
        const magic = bytesOrState.readUInt8();
        // sequence bit
        const recvBit = getControlBit(magic);
        // 2 bytes channel id
        const channel = bytesOrState.subarray(1, 3);

        return ack(channel, recvBit);
    }

    const { channel, recvBit } = bytesOrState;

    return ack(channel, recvBit);
};
