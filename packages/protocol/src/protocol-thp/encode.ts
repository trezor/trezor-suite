import { ThpState } from './ThpState';
import {
    CRC_LENGTH,
    TAG_LENGTH,
    THP_CONTROL_BYTE_ENCRYPTED,
    THP_CREATE_CHANNEL_REQUEST,
    THP_DEFAULT_CHANNEL,
    THP_READ_ACK_HEADER_BYTE,
} from './constants';
import { crc32 } from './crypto/crc32';
import { addAckBit, addSequenceBit, getControlBit, isThpMessageName } from './utils';

// @trezor/protobuf encodeMessage without direct reference to protobuf root
type ProtobufEncoder = (
    messageName: string,
    messageData: Record<string, unknown>,
) => {
    messageType: number;
    message: Buffer;
};

// utility for **RequestPayload inputs/params
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
        throw new Error('Missing nonce field');
    }

    return nonce;
};

export const encodePayload = (name: string, data: Record<string, unknown>, _thpState: ThpState) => {
    if (name === 'ThpCreateChannelRequest') {
        return createChannelRequestPayload(data);
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

    const magic = Buffer.from([THP_CREATE_CHANNEL_REQUEST]);
    const message = Buffer.concat([magic, channel, length, data]);
    const crc = crc32(message);

    return Buffer.concat([message, crc]);
};

const encodeThpMessage = (
    messageType: string,
    data: Buffer,
    channel: Buffer,
    _thpState: ThpState,
) => {
    if (messageType === 'ThpCreateChannelRequest') {
        return createChannelRequest(data, channel);
    }

    throw new Error(`Unknown ThpMessage type ${messageType}`);
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
        throw new Error('ThpState missing');
    }

    const length = Buffer.alloc(2);
    length.writeUInt16BE(1 + 2 + data.length + TAG_LENGTH + CRC_LENGTH); // 1 session_id + 2 messageType + protobuf len + 16 tag + 4 crc

    const magic = addSequenceBit(THP_CONTROL_BYTE_ENCRYPTED, thpState.sendBit);
    const header = Buffer.concat([magic, channel]);

    const messageTypeBytes = Buffer.alloc(2);
    messageTypeBytes.writeUInt16BE(messageType);
    // TODO: add-crypto
    // const cipheredMessage = cipherMessage(
    //     thpState.handshakeCredentials.hostKey,
    //     thpState.sendNonce,
    //     Buffer.alloc(0),
    //     Buffer.concat([thpState.sessionId, messageTypeBytes, data]),
    // );
    const cipheredMessage = Buffer.concat([Buffer.alloc(0), messageTypeBytes, data]);
    const message = Buffer.concat([header, length, cipheredMessage]);
    const crc = crc32(message);

    return Buffer.concat([message, crc]);
};

// TODO: link-to-public-docs
// https://www.notion.so/satoshilabs/THP-Specification-2-0-18fdc5260606806ab573d0a7cba1897a
// example: 2012340004d9fcce58
// [magic | channel | len  | crc     ]
// [20    | 1234    | 0004 | d9fcce58]
const encodeReadAck = (channel: Buffer, syncBit: number) => {
    const length = Buffer.alloc(2);
    length.writeUInt16BE(CRC_LENGTH);

    const magic = addAckBit(THP_READ_ACK_HEADER_BYTE, syncBit);
    const message = Buffer.concat([magic, channel, length]);
    const crc = crc32(message);

    return Buffer.concat([message, crc]);
};

export const encodeAck = (bytesOrState: Buffer | ThpState) => {
    if (Buffer.isBuffer(bytesOrState)) {
        // 1 byte
        const magic = bytesOrState.readUInt8();
        // sequence bit
        const recvBit = getControlBit(magic);
        // 2 bytes channel id
        const channel = bytesOrState.subarray(1, 3);

        return encodeReadAck(channel, recvBit);
    }

    const { channel, recvBit } = bytesOrState;

    return encodeReadAck(channel, recvBit);
};

// Encode protocol-v2 message
export const encode = (options: {
    messageName: string;
    data: Record<string, unknown>;
    thpState?: ThpState;
    protobufEncoder: ProtobufEncoder;
    header?: Buffer;
}) => {
    if (!options.thpState) {
        throw new Error('ThpState missing');
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
