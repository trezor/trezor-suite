import {
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
} from './constants';
import { clearControlBit } from './utils';

export const validateThpMessageName = (name: string | number) => {
    if (typeof name !== 'string') return false;

    const names = [
        'ThpCreateChannelRequest',
        // 'ThpCreateChannelResponse',
        'ThpHandshakeInitRequest',
        // 'ThpHandshakeInitResponse',
        'ThpHandshakeCompletionRequest',
        // 'ThpHandshakeCompletionResponse',
        'ThpReadAck',
    ];

    return names.includes(name);
};

export const validateThpMessageMagic = (magic: number) => {
    const known = [
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
    ];

    return known.includes(clearControlBit(magic));
};
