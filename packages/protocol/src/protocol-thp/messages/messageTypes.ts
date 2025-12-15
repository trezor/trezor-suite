// protobuf messages handled by the THP layer of Trezor firmware
// not defined in the firmware proto files.
// created and maintained manually

import type {
    ThpCredentialResponse,
    ThpDeviceProperties,
    ThpPairingMethod,
    ThpProtobufMessageType,
} from './protobufTypes';

export type ThpError = {
    code:
        | 'ThpTransportBusy'
        | 'ThpUnallocatedChannel'
        | 'ThpDecryptionFailed'
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
    tryToUnlock: 0 | 1;
};

export type ThpHandshakeInitResponse = {
    trezorEphemeralPubkey: Buffer;
    trezorEncryptedStaticPubkey: Buffer;
    tag: Buffer;
};

export type ThpHandshakeCompletionRequest = {
    hostPubkey: Buffer;
    encryptedPayload: Buffer;
};

// 0 - not paired
// 1 - paired but will require connection confirmation (thp_connection_request)
// 2 - paired with autoconnect. no further interaction needed
export type ThpHandshakeCompletionResponse = {
    state: 0 | 1 | 2;
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
    pairingMethods: ThpPairingMethod[];
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

export type ThpCredentials = ThpCredentialResponse & {
    host_static_key: string;
    autoconnect?: boolean;
};

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
