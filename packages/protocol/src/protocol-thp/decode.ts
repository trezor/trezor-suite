import { ThpState } from './ThpState';
import {
    CRC_LENGTH,
    THP_CREATE_CHANNEL_RESPONSE,
    THP_ERROR_HEADER_BYTE,
    THP_READ_ACK_HEADER_BYTE,
} from './constants';
import { TransportProtocolDecode } from '../types';
import { crc32 } from './crypto/crc32';
import { ThpError, ThpMessageResponse } from './messages';
import { clearControlBit, readThpHeader } from './utils';

type ThpMessage = ReturnType<TransportProtocolDecode> & {
    magic: number;
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

// TODO: link-to-public-docs
// https://www.notion.so/satoshilabs/THP-Specification-2-0-18fdc5260606806ab573d0a7cba1897a
// example: 41ffff0020639ba57ff4e0c2343c830a0454335731180220002802280328042801c0171551
// [magic | channel | len* | nonce               | protobuf: messageType + message          | crc     ]
// [41    | ffff    | 0020 | 639ba57ff4e0c234    | 3c830a0454335731180220002802280328042801 | c0171551]
// *len includes nonce+protobuf+crc
const createChannelResponse = (
    { payload }: ThpMessage,
    protobufDecoder: ProtobufDecoder,
): ThpMessageResponse => {
    const nonce = payload.subarray(0, 8);
    const channel = payload.subarray(8, 10);
    const props = payload.subarray(10, payload.length - CRC_LENGTH);
    const properties = protobufDecoder('ThpDeviceProperties', props).message;
    // TODO: add-crypto
    // const handshakeHash = handleCreateChannelResponse(props);

    return {
        type: 'ThpCreateChannelResponse',
        message: {
            nonce,
            channel,
            properties,
            // TODO: add-crypto
            // handshakeHash,
        },
    } as any;
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
            case 0x04:
                return 'ThpInvalidData';
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

const validateCrc = (decodedMessage: ReturnType<TransportProtocolDecode>) => {
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
    const crc = decodedMessage.payload.subarray(payloadLen, decodedMessage.length);

    // compare both crc
    if (expectedCrc.compare(crc) !== 0) {
        throw new Error(
            `Invalid CRC. expected: ${expectedCrc.toString('hex')} received: ${crc.toString('hex')}`,
        );
    }
};

// Decode protocol-v2 message from thp send process: ThpAck or ThpError
export const decodeSendAck = (decodedMessage: MessageV2) => {
    validateCrc(decodedMessage);

    const header = readThpHeader(decodedMessage.header);
    const magic = clearControlBit(header.magic);
    if (magic === THP_ERROR_HEADER_BYTE) {
        return decodeThpError(decodedMessage.payload);
    }
    if (magic === THP_READ_ACK_HEADER_BYTE) {
        return decodeReadAck();
    }

    throw new Error('Unexpected send response: ' + magic);
};

// Decode protocol-v2 message from thp receive process
export const decode = (
    decodedMessage: MessageV2,
    protobufDecoder: ProtobufDecoder,
    thpState?: ThpState,
): ThpMessageResponse => {
    if (!thpState) {
        throw new Error('Cannot decode THP message without ThpState');
    }

    validateCrc(decodedMessage);

    const header = readThpHeader(decodedMessage.header);
    const message: ThpMessage = {
        ...decodedMessage,
        ...header,
        thpState,
    };

    const magic = clearControlBit(message.magic);
    if (magic === THP_ERROR_HEADER_BYTE) {
        return decodeThpError(message.payload);
    }

    if (magic === THP_READ_ACK_HEADER_BYTE) {
        return decodeReadAck();
    }

    if (magic === THP_CREATE_CHANNEL_RESPONSE) {
        return createChannelResponse(message, protobufDecoder);
    }

    throw new Error('Unknown message type: ' + magic);
};
