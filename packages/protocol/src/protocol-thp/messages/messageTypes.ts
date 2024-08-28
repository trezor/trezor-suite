// protobuf messages handled by the THP layer of Trezor firmware
// not defined in the firmware proto files. created and maintained manually

import type {
    ThpCredentialResponse,
    ThpDeviceProperties,
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
    encryptedPayload: Buffer;
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
    hostStaticPublicKey: Buffer;
    hostKey: Buffer;
    trezorKey: Buffer;
    trezorCpacePublicKey: Buffer;
};

export type ThpCredentials = ThpCredentialResponse & { autoconnect?: boolean };

export type ThpMessageSyncBit = 0 | 1;

// same as @trezor/protobuf Messages
export type MessageKey = keyof ThpMessageType;

export type MessagePayload<T extends MessageKey = MessageKey> = ThpMessageType[T];

export type MessageResponse<T extends MessageKey = MessageKey> = T extends any
    ? {
          type: T;
          message: MessagePayload<T>;
      }
    : never;

export type TypedCall = {
    <T extends MessageKey, R extends MessageKey[]>(
        type: T,
        resType: R,
        message?: MessagePayload<T>,
    ): Promise<MessageResponse<R[number]>>;
    <T extends MessageKey, R extends MessageKey>(
        type: T,
        resType: R,
        message?: MessagePayload<T>,
    ): Promise<MessageResponse<R>>;
};
