import { type ThpState } from './ThpState';
import { CRC_LENGTH, TAG_LENGTH, THP_DEFAULT_CHANNEL } from './constants';
import { aesgcm, crc32 } from './crypto';
import { THP_CONTROL_BYTE } from '../protocol-v2/constants';
import { getIvFromNonce } from './crypto/tools';
import { addAckBit, addSequenceBit, isThpMessageName } from './utils';

// @trezor/protobuf encodeMessage without direct reference to protobuf root
type ProtobufEncoder = (
    messageName: string,
    messageData: Record<string, unknown>,
) => {
    messageType: number;
    message: Buffer;
};

const cipherMessage = (key: Buffer, sendNonce: number, handshakeHash: Buffer, payload: Buffer) => {
    // Set encrypted_payload = AES-GCM-ENCRYPT(key=k, IV=0^96, ad=h, plaintext=payload_binary).
    const aes = aesgcm(key, getIvFromNonce(sendNonce));
    aes.auth(handshakeHash);
    const encryptedPayload = aes.encrypt(payload);
    const encryptedPayloadTag = aes.finish();

    return Buffer.concat([encryptedPayload, encryptedPayloadTag]);
};

// utility for **RequestPayload inputs/params
const getBytesFromField = (data: Record<string, unknown>, fieldName: string) => {
    const value = data[fieldName];
    if (typeof value === 'string') {
        return Buffer.from(value, 'hex');
    }
    if (typeof value === 'number') {
        return Buffer.from([value]);
    }
    if (Buffer.isBuffer(value)) {
        return value;
    }
};

const createChannelRequestPayload = (data: Record<string, unknown>) => {
    const nonce = getBytesFromField(data, 'nonce');
    if (!nonce) {
        throw new Error('Missing nonce field');
    }

    return nonce;
};

const handshakeInitRequestPayload = (data: Record<string, unknown>, _thpState: ThpState) => {
    const key = getBytesFromField(data, 'key');
    if (!key) {
        throw new Error('ThpHandshakeInitRequest missing key field');
    }

    const tryToUnlock = getBytesFromField(data, 'tryToUnlock') ?? Buffer.from([0]);

    return Buffer.concat([key, tryToUnlock]);
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

    return Buffer.alloc(0);
};

// TODO: link-to-public-docs
// https://www.notion.so/satoshilabs/THP-Specification-2-0-18fdc5260606806ab573d0a7cba1897a
// example: 40ffff000c639ba57ff4e0c2348189a406
// [magic | channel | len*  | nonce            | crc     ]
// [40    | ffff    | 000c  | 639ba57ff4e0c234 | 8189a406]
// *len includes nonce+crc
const createChannelRequest = (data: Buffer, channel: Buffer) => {
    const length = Buffer.alloc(2);
    length.writeUInt16BE(data.length + CRC_LENGTH); // 8 nonce + 4 crc

    const magic = Buffer.from([THP_CONTROL_BYTE.CHANNEL_ALLOCATION_REQ]);
    const message = Buffer.concat([magic, channel, length, data]);
    const crc = crc32(message);

    return Buffer.concat([message, crc]);
};

const handshakeInitRequest = (data: Buffer, channel: Buffer) => {
    const length = Buffer.alloc(2);
    length.writeUInt16BE(data.length + CRC_LENGTH);

    const magic = Buffer.from([THP_CONTROL_BYTE.HANDSHAKE_INIT_REQ]);
    const message = Buffer.concat([magic, channel, length, data]);
    const crc = crc32(message);

    return Buffer.concat([message, crc]);
};

const handshakeCompletionRequest = (data: Buffer, channel: Buffer, sendBit: number) => {
    const length = Buffer.alloc(2);
    length.writeUInt16BE(data.length + CRC_LENGTH);

    const magic = addSequenceBit(THP_CONTROL_BYTE.HANDSHAKE_COMP_REQ, sendBit);
    const message = Buffer.concat([magic, channel, length, data]);
    const crc = crc32(message);

    return Buffer.concat([message, crc]);
};

const encodeThpMessage = (
    messageType: string,
    data: Buffer,
    channel: Buffer,
    thpState: ThpState,
) => {
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

// TODO: link-to-public-docs
// https://www.notion.so/satoshilabs/THP-Specification-2-0-18fdc5260606806ab573d0a7cba1897a
export const encodeProtobufMessage = (
    messageType: number,
    data: Buffer,
    channel: Buffer,
    thpState?: ThpState,
) => {
    if (!thpState) {
        throw new Error('ThpStateMissing');
    }

    const length = Buffer.alloc(2);
    length.writeUInt16BE(1 + 2 + data.length + TAG_LENGTH + CRC_LENGTH); // 1 session_id + 2 messageType + protobuf len + 16 tag + 4 crc

    // TODO: distinguish encrypted and decrypted messages (not implemented in FW)
    const magic = addSequenceBit(THP_CONTROL_BYTE.ENCRYPTED, thpState.sendBit);
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

// TODO: link-to-public-docs
// https://www.notion.so/satoshilabs/THP-Specification-2-0-18fdc5260606806ab573d0a7cba1897a
// example: 2012340004d9fcce58
// [magic | channel | len  | crc     ]
// [20    | 1234    | 0004 | d9fcce58]
export const encodeAck = (state: ThpState) => {
    const length = Buffer.alloc(2);
    length.writeUInt16BE(CRC_LENGTH);

    const magic = addAckBit(THP_CONTROL_BYTE.ACK_MESSAGE, state.recvAckBit);
    const message = Buffer.concat([magic, state.channel, length]);
    const crc = crc32(message);

    return Buffer.concat([message, crc]);
};

// Encode protocol-v2 message
export const encode = (options: {
    messageName: string;
    data: Record<string, unknown>;
    thpState?: ThpState;
    protobufEncoder: ProtobufEncoder;
}) => {
    if (!options.thpState) {
        throw new Error('ThpStateMissing');
    }

    const channel = options.thpState.channel || THP_DEFAULT_CHANNEL;
    const { messageName, data, protobufEncoder, thpState } = options;

    let result: Buffer;
    if (isThpMessageName(messageName)) {
        const payload = encodePayload(messageName, data, thpState);
        result = encodeThpMessage(messageName, payload, channel, options.thpState);
    } else {
        const { messageType, message } = protobufEncoder(messageName, data);
        result = encodeProtobufMessage(messageType, message, channel, thpState);
    }

    return result;
};
