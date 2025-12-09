export const HEADER_SIZE = 1 + 2; // 1: control_byte + 2: channel
export const MESSAGE_LEN_SIZE = 2;

// https://github.com/trezor/trezor-firmware/blob/dc7dccfa6c6121333f732c39565878fc46e67085/core/src/trezor/wire/thp/__init__.py
export const THP_CONTROL_BYTE = {
    HANDSHAKE_INIT_REQ: 0x00, // out
    HANDSHAKE_INIT_RES: 0x01, // in
    HANDSHAKE_COMP_REQ: 0x02, // out
    HANDSHAKE_COMP_RES: 0x03, // in
    ENCRYPTED: 0x04, // in / out
    ACK_MESSAGE: 0x20, // in / out
    CHANNEL_ALLOCATION_REQ: 0x40, // out
    CHANNEL_ALLOCATION_RES: 0x41, // in
    ERROR: 0x42, // in
    PING: 0x43, // out
    PONG: 0x44, // in
    CONTINUATION_PACKET: 0x80, // in / out
};
