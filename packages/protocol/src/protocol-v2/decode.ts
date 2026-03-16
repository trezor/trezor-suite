import * as ERRORS from '../errors';
import { HEADER_SIZE, MESSAGE_LEN_SIZE, THP_CONTROL_BYTE } from './constants';
import { getHeaders } from './encode';
import { type TransportProtocolDecode } from '../types';

// TODO: link-to-public-docs
// https://github.com/trezor/trezor-firmware/blob/m1nd3r/thp-documentation/docs/common/thp/specification.md#transport-packet-structure
export const decodeCtrlByte = (ctrlByte: number) => {
    // DATA message
    const dataType = ctrlByte & 0xe7;
    switch (dataType) {
        case THP_CONTROL_BYTE.HANDSHAKE_COMP_REQ:
        case THP_CONTROL_BYTE.HANDSHAKE_COMP_RES:
        case THP_CONTROL_BYTE.HANDSHAKE_INIT_REQ:
        case THP_CONTROL_BYTE.HANDSHAKE_INIT_RES:
        case THP_CONTROL_BYTE.ENCRYPTED:
            return dataType;
    }

    // ACK message
    const ackType = ctrlByte & 0xf7;
    if (ackType === THP_CONTROL_BYTE.ACK_MESSAGE) {
        return ackType;
    }

    // Unmasked message
    switch (ctrlByte) {
        case THP_CONTROL_BYTE.CHANNEL_ALLOCATION_REQ:
        case THP_CONTROL_BYTE.CHANNEL_ALLOCATION_RES:
        case THP_CONTROL_BYTE.PING:
        case THP_CONTROL_BYTE.PONG:
        case THP_CONTROL_BYTE.ERROR:
            return ctrlByte;
    }

    return undefined;
};

// Parses raw input from Trezor and returns some information about the whole message
export const decode: TransportProtocolDecode = bytes => {
    const buffer = Buffer.from(bytes);

    // chunk should have at least 5 bytes. 3 bytes `header` + 2 bytes `length`
    if (buffer.byteLength < HEADER_SIZE + MESSAGE_LEN_SIZE) {
        throw new Error(ERRORS.PROTOCOL_MALFORMED);
    }

    const messageType = decodeCtrlByte(buffer.readUInt8());
    if (messageType === undefined) {
        throw new Error(ERRORS.PROTOCOL_MALFORMED);
    }

    const [header, chunkHeader] = getHeaders(buffer);

    return {
        header,
        chunkHeader,
        length: buffer.readUint16BE(HEADER_SIZE),
        messageType,
        payload: buffer.subarray(HEADER_SIZE + MESSAGE_LEN_SIZE),
    };
};
