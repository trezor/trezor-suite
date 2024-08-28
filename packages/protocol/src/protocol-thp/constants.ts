export const THP_CREATE_CHANNEL_REQUEST = 0x40;
export const THP_CREATE_CHANNEL_RESPONSE = 0x41;
export const THP_HANDSHAKE_INIT_REQUEST = 0x00;
export const THP_HANDSHAKE_INIT_RESPONSE = 0x01;
export const THP_HANDSHAKE_COMPLETION_REQUEST = 0x02;
export const THP_HANDSHAKE_COMPLETION_RESPONSE = 0x03;
export const THP_ERROR_HEADER_BYTE = 0x42;
export const THP_READ_ACK_HEADER_BYTE = 0x20; // [0x20, 0x30];
export const THP_CONTROL_BYTE_ENCRYPTED = 0x04; // [0x04, 0x14];
export const THP_CONTROL_BYTE_DECRYPTED = 0x05; // [0x05, 0x15];
export const THP_CONTINUATION_PACKET = 0x80;
export const THP_READ_ACK_MASK = 0xf7;
export const THP_DATA_MASK = 0xe7;

export const THP_MAGIC = {
    ThpCreateChannelRequest: 0x40,
    ThpCreateChannelResponse: 0x41,
    ThpHandshakeInitRequest: 0x00,
    ThpHandshakeInitResponse: 0x01,
    ThpHandshakeCompletionRequest: 0x02,
    ThpHandshakeCompletionResponse: 0x03,
    ThpError: 0x42,
    ThpReadAck: 0x20,
    ThpEncryptedMessage: 0x04,
    ThpDecryptedMessage: 0x05,
    ThpContinuationPacket: 0x80,
};

export const THP_DEFAULT_CHANNEL = Buffer.from([0xff, 0xff]);

export const CRC_LENGTH = 4;
export const TAG_LENGTH = 16;
