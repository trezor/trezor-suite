// Messages handled by THP layer of Trezor firmware
// not defined in any proto files, created and maintained manually

import type {
    ThpDeviceProperties,
    ThpHandshakeCompletionReqNoisePayload,
    ThpProtobufMessageType,
} from './protobufTypes';

export type ThpError = {
    code: string;
    message: string;
};

export type ThpReadAck = {
    ack: true;
};

export type ThpCreateChannelRequest = {
    nonce: Buffer;
};

export type ThpCreateChannelResponse = {
    nonce: Buffer;
    channel: Buffer;
    properties: ThpDeviceProperties;
    handshakeHash: Buffer;
};

export type ThpHandshakeInitRequest = {
    key: Buffer;
};

export type ThpHandshakeInitResponse = {
    handshakeHash: Buffer;
    trezorEphemeralPubkey: Buffer;
    trezorEncryptedStaticPubkey: Buffer;
    trezorMaskedStaticPubkey: Buffer;
    tag: Buffer;
    hostEncryptedStaticPubkey: Buffer;
    hostKey: Buffer;
    trezorKey: Buffer;
};

export type ThpHandshakeCompletionRequest = {
    hostPubkey: Buffer;
    noise: ThpHandshakeCompletionReqNoisePayload;
};

export type ThpHandshakeCompletionResponse = {
    state: 0 | 1;
    tag: Buffer;
};

export type ThpMessageType = ThpProtobufMessageType & {
    ThpError: ThpError;
    ThpReadAck: ThpReadAck;
    ThpCreateChannelRequest: ThpCreateChannelRequest;
    ThpCreateChannelResponse: ThpCreateChannelResponse;
    ThpHandshakeInitRequest: ThpHandshakeInitRequest;
    ThpHandshakeInitResponse: ThpHandshakeInitResponse;
    ThpHandshakeCompletionRequest: ThpHandshakeCompletionRequest;
    ThpHandshakeCompletionResponse: ThpHandshakeCompletionResponse;
};

export type ThpHandshakeCredentials = {
    pairingMethods: ThpDeviceProperties['pairing_methods'];
    handshakeHash: Buffer;
    handshakeCommitment: Buffer;
    codeEntryChallenge: Buffer;
    trezorEncryptedStaticPubkey: Buffer;
    hostEncryptedStaticPubkey: Buffer;
    hostKey: Buffer;
    trezorKey: Buffer;
};

export type ThpMessageSyncBit = 0 | 1;
