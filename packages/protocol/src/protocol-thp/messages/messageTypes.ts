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

export type ThpMessageType = ThpProtobufMessageType & {
    ThpError: ThpError;
    ThpAck: ThpAck;
    ThpCreateChannelRequest: ThpCreateChannelRequest;
    ThpCreateChannelResponse: ThpCreateChannelResponse;
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
