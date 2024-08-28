import { ThpState } from './ThpState';
import {
    CRC_LENGTH,
    TAG_LENGTH,
    THP_CONTROL_BYTE_DECRYPTED,
    THP_CONTROL_BYTE_ENCRYPTED,
    THP_CREATE_CHANNEL_REQUEST,
    THP_DEFAULT_CHANNEL,
    THP_HANDSHAKE_COMPLETION_REQUEST,
    THP_HANDSHAKE_INIT_REQUEST,
    THP_READ_ACK_HEADER_BYTE,
} from './constants';
import { aesgcm, crc32 } from './crypto';
import { getIvFromNonce } from './crypto/tools';
import { addAckBit, addSequenceBit, getControlBit } from './utils';
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

const handshakeInitRequestPayload = (data: Record<string, unknown>, _thpState: ThpState) => {
    const key = getBytesFromField(data, 'key');
    if (!key) {
        throw new Error('ThpHandshakeInitRequest missing key field');
    }

    return key;
};

const handshakeCompletionRequestPayload = (data: Record<string, unknown>) => {
    const hostPubkey = getBytesFromField(data, 'hostPubkey');
    if (!hostPubkey) {
        throw new Error('ThpHandshakeCompletionRequest missing hostPubkey field');
    }
    const encryptedPayload = getBytesFromField(data, 'encryptedPayload');
    if (!encryptedPayload) {
        throw new Error('ThpHandshakeCompletionRequest missing encryptedPayload field');
    }

    return Buffer.concat([hostPubkey, encryptedPayload]);
};

type ProtobufEncoder = (
    messageName: any, // string | number
    messageData: any, // Record<string, unknown>? buffer?
) => {
    messageType: number;
    message: Buffer;
};

export const encodePayload = (name: string, data: Record<string, unknown>, thpState: ThpState) => {
    if (name === 'ThpCreateChannelRequest') {
        return createChannelRequestPayload(data);
    }
    if (name === 'ThpHandshakeInitRequest') {
        return handshakeInitRequestPayload(data, thpState);
    }
    if (name === 'ThpHandshakeCompletionRequest') {
        return handshakeCompletionRequestPayload(data);
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
    thpState: ThpState,
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
        return handshakeCompletionRequest(data, channel, thpState.sendBit || 0);
    }

    throw new Error(`Unknown Thp message type ${messageType}`);
};

export const encodeProtobufMessage = (
    messageType: number,
    data: Buffer,
    channel: Buffer,
    thpState?: ThpState,
) => {
    if (!thpState) {
        throw new Error('cannot encode without ThpState');
    }

    const length = Buffer.alloc(2);
    length.writeUInt16BE(1 + 2 + data.length + TAG_LENGTH + CRC_LENGTH); // 1 session_id + 2 messageType + protobuf len + 16 tag + 4 crc

    // TODO: distinguish encrypted(fw) and decrypted(bootloader) messages
    const magic = addSequenceBit(
        THP_CONTROL_BYTE_ENCRYPTED || THP_CONTROL_BYTE_DECRYPTED,
        thpState.sendBit,
    );
    const header = Buffer.concat([magic, channel]);

    const messageTypeBytes = Buffer.alloc(2);
    messageTypeBytes.writeUInt16BE(messageType);
    const cipheredMessage = cipherMessage(
        thpState.handshakeCredentials!.hostKey,
        thpState.sendNonce,
        Buffer.alloc(0),
        Buffer.concat([thpState.sessionId, messageTypeBytes, data]),
    );
    const message = Buffer.concat([header, length, cipheredMessage]);
    const crc = crc32(message);

    return Buffer.concat([message, crc]);
};

// encode data generated by protocol-thp
export const encode = (options: {
    data: Record<string, any>;
    messageType: number | string;
    thpState?: ThpState;
    protobufEncoder: ProtobufEncoder;
    header?: Buffer; // TODO: this is used by bridge?
}) => {
    if (!options.thpState) {
        throw new Error('Cannot encode THP message without ThpState');
    }

    const channel = options.thpState.channel || THP_DEFAULT_CHANNEL;
    const { messageType, protobufEncoder, thpState } = options;

    let result: Buffer;
    if (typeof messageType === 'string' && validateThpMessageName(messageType)) {
        const payload = encodePayload(messageType, options.data, thpState);
        result = encodeThpMessage(
            messageType,
            payload,
            channel,
            options.thpState,
            Buffer.alloc(3), // header
        );
    } else {
        const { messageType: mt, message } = protobufEncoder(messageType, options.data);
        result = encodeProtobufMessage(mt, message, channel, options.thpState);
    }

    return result;
};

export const encodeAck = (bytesOrState: Buffer | ThpState) => {
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
