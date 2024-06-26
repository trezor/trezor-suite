// This file is auto generated from ./protobufDefinitions.ts

export enum ThpPairingMethod {
    NoMethod = 1,
    CodeEntry = 2,
    QrCode = 3,
    NFC_Unidirectional = 4,
}

export type ThpDeviceProperties = {
    internal_model: string;
    model_variant: number;
    bootloader_mode: boolean;
    protocol_version: number;
    pairing_methods: ThpPairingMethod[];
};

export type ThpHandshakeCompletionReqNoisePayload = {
    host_pairing_credential?: string;
    pairing_methods: ThpPairingMethod[];
};

export type ThpCreateNewSession = {
    passphrase?: string;
    on_device?: boolean;
    derive_cardano?: boolean;
};

export type ThpNewSession = {
    new_session_id: number;
};

export type ThpStartPairingRequest = {
    host_name: string;
};

export type ThpPairingPreparationsFinished = Record<string, never>;

export type ThpCodeEntryCommitment = {
    commitment: string;
};

export type ThpCodeEntryChallenge = {
    challenge: string;
};

export type ThpCodeEntryCpaceHost = {
    cpace_host_public_key: string;
};

export type ThpCodeEntryCpaceTrezor = {
    cpace_trezor_public_key: string;
};

export type ThpCodeEntryTag = {
    tag: string;
};

export type ThpCodeEntrySecret = {
    secret: string;
};

export type ThpQrCodeTag = {
    tag: string;
};

export type ThpQrCodeSecret = {
    secret: string;
};

export type ThpNfcUnidirectionalTag = {
    tag: string;
};

export type ThpNfcUnidirectionalSecret = {
    secret: string;
};

export type ThpCredentialRequest = {
    host_static_pubkey: string;
};

export type ThpCredentialResponse = {
    trezor_static_pubkey: string;
    credential: string;
};

export type ThpEndRequest = Record<string, never>;

export type ThpEndResponse = Record<string, never>;

export enum MessageType {
    MessageType_ThpCreateNewSession = 1000,
    MessageType_ThpNewSession = 1001,
    MessageType_ThpStartPairingRequest = 1008,
    MessageType_ThpPairingPreparationsFinished = 1009,
    MessageType_ThpCredentialRequest = 1010,
    MessageType_ThpCredentialResponse = 1011,
    MessageType_ThpEndRequest = 1012,
    MessageType_ThpEndResponse = 1013,
    MessageType_ThpCodeEntryCommitment = 1016,
    MessageType_ThpCodeEntryChallenge = 1017,
    MessageType_ThpCodeEntryCpaceHost = 1018,
    MessageType_ThpCodeEntryCpaceTrezor = 1019,
    MessageType_ThpCodeEntryTag = 1020,
    MessageType_ThpCodeEntrySecret = 1021,
    MessageType_ThpQrCodeTag = 1024,
    MessageType_ThpQrCodeSecret = 1025,
    MessageType_ThpNfcUnidirectionalTag = 1032,
    MessageType_ThpNfcUnidirectionalSecret = 1033,
}

export type ThpProtobufMessageType = {
    ThpDeviceProperties: ThpDeviceProperties;
    ThpHandshakeCompletionReqNoisePayload: ThpHandshakeCompletionReqNoisePayload;
    ThpCreateNewSession: ThpCreateNewSession;
    ThpNewSession: ThpNewSession;
    ThpStartPairingRequest: ThpStartPairingRequest;
    ThpPairingPreparationsFinished: ThpPairingPreparationsFinished;
    ThpCodeEntryCommitment: ThpCodeEntryCommitment;
    ThpCodeEntryChallenge: ThpCodeEntryChallenge;
    ThpCodeEntryCpaceHost: ThpCodeEntryCpaceHost;
    ThpCodeEntryCpaceTrezor: ThpCodeEntryCpaceTrezor;
    ThpCodeEntryTag: ThpCodeEntryTag;
    ThpCodeEntrySecret: ThpCodeEntrySecret;
    ThpQrCodeTag: ThpQrCodeTag;
    ThpQrCodeSecret: ThpQrCodeSecret;
    ThpNfcUnidirectionalTag: ThpNfcUnidirectionalTag;
    ThpNfcUnidirectionalSecret: ThpNfcUnidirectionalSecret;
    ThpCredentialRequest: ThpCredentialRequest;
    ThpCredentialResponse: ThpCredentialResponse;
    ThpEndRequest: ThpEndRequest;
    ThpEndResponse: ThpEndResponse;
};
