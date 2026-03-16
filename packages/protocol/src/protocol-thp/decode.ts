import { type ThpState } from './ThpState';
import { CRC_LENGTH, TAG_LENGTH } from './constants';
import { aesgcm } from './crypto';
import { THP_CONTROL_BYTE } from '../protocol-v2/constants';
import { type TransportProtocolDecode } from '../types';
import { crc32 } from './crypto/crc32';
import { getHandshakeHash, getTrezorState } from './crypto/pairing';
import { getIvFromNonce } from './crypto/tools';
import { type ThpDeviceProperties, type ThpError, type ThpMessageResponse } from './messages';

type ThpMessage = ReturnType<TransportProtocolDecode> & {
    thpState: ThpState;
};

// @trezor/protobuf decodeMessage without direct reference to protobuf root
type ProtobufDecoder = (
    messageType: string | number,
    payload: Buffer,
) => {
    type: string;
    message: Record<string, unknown>;
};

type MessageV2 = ReturnType<TransportProtocolDecode>;

const decipherMessage = (key: Buffer, recvNonce: number, payload: Buffer, tag: Buffer) => {
    const aes = aesgcm(key, getIvFromNonce(recvNonce));
    aes.auth(Buffer.alloc(0));
    const trezorMaskedStaticPubkey = aes.decrypt(payload, tag);

    return trezorMaskedStaticPubkey.subarray(1); // NOTE: remove session_id (first byte)
};

// TODO: link-to-public-docs
// https://www.notion.so/satoshilabs/THP-Specification-2-0-18fdc5260606806ab573d0a7cba1897a
// example: 41ffff0020639ba57ff4e0c2343c830a0454335731180220002802280328042801c0171551
// [magic | channel | len* | nonce               | protobuf: messageType + message          | crc     ]
// [41    | ffff    | 0020 | 639ba57ff4e0c234    | 3c830a0454335731180220002802280328042801 | c0171551]
// *len includes nonce+protobuf+crc
const createChannelResponse = (
    { payload }: ThpMessage,
    protobufDecoder: ProtobufDecoder,
): ThpMessageResponse<'ThpCreateChannelResponse'> => {
    const nonce = payload.subarray(0, 8);
    const channel = payload.subarray(8, 10);
    const props = payload.subarray(10, payload.length - CRC_LENGTH);
    const properties = protobufDecoder('ThpDeviceProperties', props).message as ThpDeviceProperties;
    const handshakeHash = getHandshakeHash(props);

    return {
        type: 'ThpCreateChannelResponse',
        message: {
            nonce,
            channel,
            properties,
            handshakeHash,
        },
    };
};

const readHandshakeInitResponse = ({
    payload,
}: ThpMessage): ThpMessageResponse<'ThpHandshakeInitResponse'> => {
    const trezorEphemeralPubkey = payload.subarray(0, 32);
    const trezorEncryptedStaticPubkey = payload.subarray(32, 32 + 48);
    const tag = payload.subarray(32 + 48, 32 + 48 + TAG_LENGTH);

    return {
        type: 'ThpHandshakeInitResponse',
        message: {
            trezorEphemeralPubkey,
            trezorEncryptedStaticPubkey,
            tag,
        },
    };
};

const readHandshakeCompletionResponse = ({
    payload,
    thpState,
}: ThpMessage): ThpMessageResponse<'ThpHandshakeCompletionResponse'> => {
    const state = getTrezorState(thpState.handshakeCredentials!, payload);

    return {
        type: 'ThpHandshakeCompletionResponse',
        message: {
            state,
        },
    };
};

const readProtobufMessage = (
    { payload, thpState }: ThpMessage,
    protobufDecoder: ProtobufDecoder,
): ThpMessageResponse => {
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

    return protobufDecoder(messageType, messagePayload) as ThpMessageResponse;
};

const decodeReadAck = (): ThpMessageResponse => ({
    type: 'ThpAck',
    message: {},
});

// TODO: link-to-public-docs
// https://www.notion.so/satoshilabs/THP-Specification-2-0-18fdc5260606806ab573d0a7cba1897a
// example: 42122200050270303cfa
// [magic | channel | len* | error | crc     ]
// [42    | 1222    | 0005 | 02    | 70303cfa]
// *len includes error+crc
const decodeThpError = (payload: Buffer): ThpMessageResponse => {
    const [errorType] = payload;

    const error = (() => {
        switch (errorType) {
            case 0x01:
                return 'ThpTransportBusy';
            case 0x02:
                return 'ThpUnallocatedChannel';
            case 0x03:
                return 'ThpDecryptionFailed';
            case 0x05:
                return 'ThpDeviceLocked';
            default:
                return 'ThpUnknownError';
        }
    })();

    const message: ThpError = {
        code: error,
        message: error ?? `Unknown ThpError ${errorType}`,
    };

    return {
        type: 'ThpError',
        message,
    };
};

export const getCRC = (decodedMessage: MessageV2) =>
    decodedMessage.payload.subarray(decodedMessage.length - CRC_LENGTH, decodedMessage.length);

export const validateCrc = (decodedMessage: MessageV2) => {
    // payload length without crc
    const payloadLen = decodedMessage.length - CRC_LENGTH;
    const length = Buffer.alloc(2);
    length.writeUInt16BE(decodedMessage.length);
    // build crc locally
    const expectedCrc = crc32(
        Buffer.concat([
            decodedMessage.header,
            length,
            decodedMessage.payload.subarray(0, payloadLen),
        ]),
    );
    // get crc from the message
    const crc = getCRC(decodedMessage);

    // compare both crc
    if (expectedCrc.compare(crc) !== 0) {
        throw new Error(
            `Invalid CRC. expected: ${expectedCrc.toString('hex')} received: ${crc.toString('hex')}`,
        );
    }
};

// Decode protocol-v2 message from thp receive process
export const decode = (
    decodedMessage: MessageV2,
    protobufDecoder: ProtobufDecoder,
    thpState?: ThpState,
): ThpMessageResponse => {
    if (!thpState) {
        throw new Error('ThpStateMissing');
    }

    const message: ThpMessage = {
        ...decodedMessage,
        thpState,
    };

    const { messageType } = decodedMessage;
    if (messageType === THP_CONTROL_BYTE.ERROR) {
        return decodeThpError(message.payload);
    }

    if (messageType === THP_CONTROL_BYTE.ACK_MESSAGE) {
        return decodeReadAck();
    }

    if (messageType === THP_CONTROL_BYTE.CHANNEL_ALLOCATION_RES) {
        return createChannelResponse(message, protobufDecoder);
    }

    if (messageType === THP_CONTROL_BYTE.HANDSHAKE_INIT_RES) {
        return readHandshakeInitResponse(message);
    }

    if (messageType === THP_CONTROL_BYTE.HANDSHAKE_COMP_RES) {
        return readHandshakeCompletionResponse(message);
    }

    if (messageType === THP_CONTROL_BYTE.ENCRYPTED) {
        return readProtobufMessage(message, protobufDecoder);
    }

    throw new Error('Unknown message type: ' + messageType);
};
