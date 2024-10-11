// This file is auto generated from ./thp.proto

export const getThpProtobufMessages = () => {
    return {
        ThpPairingMethod: {
            values: { NoMethod: 1, CodeEntry: 2, QrCode: 3, NFC_Unidirectional: 4 },
        },
        ThpDeviceProperties: {
            fields: {
                internal_model: { type: 'string', id: 1 },
                model_variant: { type: 'uint32', id: 2 },
                bootloader_mode: { type: 'bool', id: 3 },
                protocol_version: { type: 'uint32', id: 4 },
                pairing_methods: {
                    rule: 'repeated',
                    type: 'ThpPairingMethod',
                    id: 5,
                    options: { packed: false },
                },
            },
        },
        ThpHandshakeCompletionReqNoisePayload: {
            fields: {
                host_pairing_credential: { type: 'bytes', id: 1 },
                pairing_methods: {
                    rule: 'repeated',
                    type: 'ThpPairingMethod',
                    id: 2,
                    options: { packed: false },
                },
            },
        },
        ThpCreateNewSession: {
            fields: {
                passphrase: { type: 'string', id: 1 },
                on_device: { type: 'bool', id: 2 },
                derive_cardano: { type: 'bool', id: 3 },
            },
        },
        ThpNewSession: { fields: { new_session_id: { type: 'uint32', id: 1 } } },
        ThpStartPairingRequest: { fields: { host_name: { type: 'string', id: 1 } } },
        ThpPairingPreparationsFinished: { fields: {} },
        ThpCodeEntryCommitment: { fields: { commitment: { type: 'bytes', id: 1 } } },
        ThpCodeEntryChallenge: { fields: { challenge: { type: 'bytes', id: 1 } } },
        ThpCodeEntryCpaceHost: { fields: { cpace_host_public_key: { type: 'bytes', id: 1 } } },
        ThpCodeEntryCpaceTrezor: { fields: { cpace_trezor_public_key: { type: 'bytes', id: 1 } } },
        ThpCodeEntryTag: { fields: { tag: { type: 'bytes', id: 2 } } },
        ThpCodeEntrySecret: { fields: { secret: { type: 'bytes', id: 1 } } },
        ThpQrCodeTag: { fields: { tag: { type: 'bytes', id: 1 } } },
        ThpQrCodeSecret: { fields: { secret: { type: 'bytes', id: 1 } } },
        ThpNfcUnidirectionalTag: { fields: { tag: { type: 'bytes', id: 1 } } },
        ThpNfcUnidirectionalSecret: { fields: { secret: { type: 'bytes', id: 1 } } },
        ThpCredentialRequest: { fields: { host_static_pubkey: { type: 'bytes', id: 1 } } },
        ThpCredentialResponse: {
            fields: {
                trezor_static_pubkey: { type: 'bytes', id: 1 },
                credential: { type: 'bytes', id: 2 },
            },
        },
        ThpEndRequest: { fields: {} },
        ThpEndResponse: { fields: {} },
        MessageType: {
            values: {
                MessageType_ThpCreateNewSession: 1000,
                MessageType_ThpNewSession: 1001,
                MessageType_ThpStartPairingRequest: 1008,
                MessageType_ThpPairingPreparationsFinished: 1009,
                MessageType_ThpCredentialRequest: 1010,
                MessageType_ThpCredentialResponse: 1011,
                MessageType_ThpEndRequest: 1012,
                MessageType_ThpEndResponse: 1013,
                MessageType_ThpCodeEntryCommitment: 1016,
                MessageType_ThpCodeEntryChallenge: 1017,
                MessageType_ThpCodeEntryCpaceHost: 1018,
                MessageType_ThpCodeEntryCpaceTrezor: 1019,
                MessageType_ThpCodeEntryTag: 1020,
                MessageType_ThpCodeEntrySecret: 1021,
                MessageType_ThpQrCodeTag: 1024,
                MessageType_ThpQrCodeSecret: 1025,
                MessageType_ThpNfcUnidirectionalTag: 1032,
                MessageType_ThpNfcUnidirectionalSecret: 1033,
            },
        },
    };
};
