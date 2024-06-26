// protobuf messages handled by the THP layer of Trezor firmware
// not defined in the firmware proto files.
// created and maintained manually

import type {
    ThpCredentialResponse,
    ThpDeviceProperties,
    ThpProtobufMessageType,
} from './protobufTypes';

export type ThpError = {
    code:
        | 'ThpTransportBusy'
        | 'ThpUnallocatedChannel'
        | 'ThpDecryptionFailed'
        | 'ThpInvalidData'
        | 'ThpDeviceLocked'
        | 'ThpUnknownError';
    message: string;
};

export type ThpAck = Record<string, unknown>;

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
    encryptedPayload: Buffer;
};

export type ThpHandshakeCompletionResponse = {
    state: 0 | 1;
    tag: Buffer;
};

export type ThpMessageType = ThpProtobufMessageType & {
    ThpError: ThpError;
    ThpAck: ThpAck;
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
    staticKey: Buffer;
    hostStaticPublicKey: Buffer;
    hostKey: Buffer;
    trezorKey: Buffer;
    trezorCpacePublicKey: Buffer;
};

export type ThpCredentials = ThpCredentialResponse & { autoconnect?: boolean };

export type ThpMessageSyncBit = 0 | 1;

// same as @trezor/protobuf Messages
export type ThpMessageKey = keyof ThpMessageType;

export type ThpMessagePayload<T extends ThpMessageKey = ThpMessageKey> = ThpMessageType[T];

export type ThpMessageResponse<T extends ThpMessageKey = ThpMessageKey> = T extends any
    ? {
          type: T;
          message: ThpMessagePayload<T>;
      }
    : never;
