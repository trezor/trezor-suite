import { MessagesSchema } from '@trezor/protobuf';

const { CardanoNativeScriptHashDisplayFormat, CardanoNativeScriptType } = MessagesSchema;

export default {
    method: 'cardanoGetNativeScriptHash',
    setup: {
        mnemonic: 'mnemonic_all',
    },
    tests: [
        {
            description: 'PUB_KEY script',
            params: {
                script: {
                    type: CardanoNativeScriptType.PUB_KEY,
                    keyHash: 'c4b9265645fde9536c0795adbcc5291767a0c61fd62448341d7e0386',
                },
                displayFormat: CardanoNativeScriptHashDisplayFormat.HIDE,
            },
            result: {
                scriptHash: '29fb5fd4aa8cadd6705acc8263cee0fc62edca5ac38db593fec2f9fd',
            },
            legacyResults: [
                {
                    rules: ['<2.4.3', '1'],
                    payload: false,
                },
            ],
        },
        {
            description: 'PUB_KEY script containing a path',
            params: {
                script: {
                    type: CardanoNativeScriptType.PUB_KEY,
                    keyPath: "m/1854'/1815'/0'/0/0",
                },
                displayFormat: CardanoNativeScriptHashDisplayFormat.HIDE,
            },
            result: {
                scriptHash: '29fb5fd4aa8cadd6705acc8263cee0fc62edca5ac38db593fec2f9fd',
            },
            legacyResults: [
                {
                    rules: ['<2.4.3', '1'],
                    payload: false,
                },
            ],
        },
        {
            description: 'ALL script',
            params: {
                script: {
                    type: CardanoNativeScriptType.ALL,
                    scripts: [
                        {
                            type: CardanoNativeScriptType.PUB_KEY,
                            keyHash: 'c4b9265645fde9536c0795adbcc5291767a0c61fd62448341d7e0386',
                        },
                        {
                            type: CardanoNativeScriptType.PUB_KEY,
                            keyHash: '0241f2d196f52a92fbd2183d03b370c30b6960cfdeae364ffabac889',
                        },
                    ],
                },
                displayFormat: CardanoNativeScriptHashDisplayFormat.HIDE,
            },
            result: {
                scriptHash: 'af5c2ce476a6ede1c879f7b1909d6a0b96cb2081391712d4a355cef6',
            },
            legacyResults: [
                {
                    rules: ['<2.4.3', '1'],
                    payload: false,
                },
            ],
        },
        {
            description: 'ALL script containing a path',
            params: {
                script: {
                    type: CardanoNativeScriptType.ALL,
                    scripts: [
                        {
                            type: CardanoNativeScriptType.PUB_KEY,
                            keyPath: "m/1854'/1815'/0'/0/0",
                        },
                        {
                            type: CardanoNativeScriptType.PUB_KEY,
                            keyHash: '0241f2d196f52a92fbd2183d03b370c30b6960cfdeae364ffabac889',
                        },
                    ],
                },
                displayFormat: CardanoNativeScriptHashDisplayFormat.HIDE,
            },
            result: {
                scriptHash: 'af5c2ce476a6ede1c879f7b1909d6a0b96cb2081391712d4a355cef6',
            },
            legacyResults: [
                {
                    rules: ['<2.4.3', '1'],
                    payload: false,
                },
            ],
        },
        {
            description: 'ALL script containing a 1855 path',
            params: {
                script: {
                    type: CardanoNativeScriptType.ALL,
                    scripts: [
                        {
                            type: CardanoNativeScriptType.PUB_KEY,
                            keyPath: "m/1855'/1815'/0'",
                        },
                        {
                            type: CardanoNativeScriptType.PUB_KEY,
                            keyHash: '0241f2d196f52a92fbd2183d03b370c30b6960cfdeae364ffabac889',
                        },
                    ],
                },
                displayFormat: CardanoNativeScriptHashDisplayFormat.HIDE,
            },
            result: {
                scriptHash: 'fbf6672eb655c29b0f148fa1429be57c2174b067a7b3e3942e967fe8',
            },
            legacyResults: [
                {
                    rules: ['<2.4.3', '1'],
                    payload: false,
                },
            ],
        },
        {
            description: 'ANY script',
            params: {
                script: {
                    type: CardanoNativeScriptType.ANY,
                    scripts: [
                        {
                            type: CardanoNativeScriptType.PUB_KEY,
                            keyHash: 'c4b9265645fde9536c0795adbcc5291767a0c61fd62448341d7e0386',
                        },
                        {
                            type: CardanoNativeScriptType.PUB_KEY,
                            keyHash: '0241f2d196f52a92fbd2183d03b370c30b6960cfdeae364ffabac889',
                        },
                    ],
                },
                displayFormat: CardanoNativeScriptHashDisplayFormat.HIDE,
            },
            result: {
                scriptHash: 'd6428ec36719146b7b5fb3a2d5322ce702d32762b8c7eeeb797a20db',
            },
            legacyResults: [
                {
                    rules: ['<2.4.3', '1'],
                    payload: false,
                },
            ],
        },
        {
            description: 'ANY script containing a path',
            params: {
                script: {
                    type: CardanoNativeScriptType.ANY,
                    scripts: [
                        {
                            type: CardanoNativeScriptType.PUB_KEY,
                            keyPath: "m/1854'/1815'/0'/0/0",
                        },
                        {
                            type: CardanoNativeScriptType.PUB_KEY,
                            keyHash: '0241f2d196f52a92fbd2183d03b370c30b6960cfdeae364ffabac889',
                        },
                    ],
                },
                displayFormat: CardanoNativeScriptHashDisplayFormat.HIDE,
            },
            result: {
                scriptHash: 'd6428ec36719146b7b5fb3a2d5322ce702d32762b8c7eeeb797a20db',
            },
            legacyResults: [
                {
                    rules: ['<2.4.3', '1'],
                    payload: false,
                },
            ],
        },
        {
            description: 'N_OF_K script',
            params: {
                script: {
                    type: CardanoNativeScriptType.N_OF_K,
                    requiredSignaturesCount: 2,
                    scripts: [
                        {
                            type: CardanoNativeScriptType.PUB_KEY,
                            keyHash: 'c4b9265645fde9536c0795adbcc5291767a0c61fd62448341d7e0386',
                        },
                        {
                            type: CardanoNativeScriptType.PUB_KEY,
                            keyHash: '0241f2d196f52a92fbd2183d03b370c30b6960cfdeae364ffabac889',
                        },
                        {
                            type: CardanoNativeScriptType.PUB_KEY,
                            keyHash: 'cecb1d427c4ae436d28cc0f8ae9bb37501a5b77bcc64cd1693e9ae20',
                        },
                    ],
                },
                displayFormat: CardanoNativeScriptHashDisplayFormat.HIDE,
            },
            result: {
                scriptHash: '2b2b17fd18e18acae4601d4818a1dee00a917ff72e772fa8482e36c9',
            },
            legacyResults: [
                {
                    rules: ['<2.4.3', '1'],
                    payload: false,
                },
            ],
        },
        {
            description: 'N_OF_K script containing a path',
            params: {
                script: {
                    type: CardanoNativeScriptType.N_OF_K,
                    requiredSignaturesCount: 2,
                    scripts: [
                        {
                            type: CardanoNativeScriptType.PUB_KEY,
                            keyPath: "m/1854'/1815'/0'/0/0",
                        },
                        {
                            type: CardanoNativeScriptType.PUB_KEY,
                            keyHash: '0241f2d196f52a92fbd2183d03b370c30b6960cfdeae364ffabac889',
                        },
                        {
                            type: CardanoNativeScriptType.PUB_KEY,
                            keyHash: 'cecb1d427c4ae436d28cc0f8ae9bb37501a5b77bcc64cd1693e9ae20',
                        },
                    ],
                },
                displayFormat: CardanoNativeScriptHashDisplayFormat.HIDE,
            },
            result: {
                scriptHash: '2b2b17fd18e18acae4601d4818a1dee00a917ff72e772fa8482e36c9',
            },
            legacyResults: [
                {
                    rules: ['<2.4.3', '1'],
                    payload: false,
                },
            ],
        },
        {
            description: 'INVALID_BEFORE script',
            params: {
                script: {
                    type: CardanoNativeScriptType.ALL,
                    scripts: [
                        {
                            type: CardanoNativeScriptType.PUB_KEY,
                            keyHash: 'c4b9265645fde9536c0795adbcc5291767a0c61fd62448341d7e0386',
                        },
                        {
                            type: CardanoNativeScriptType.INVALID_BEFORE,
                            invalidBefore: '100',
                        },
                    ],
                },
                displayFormat: CardanoNativeScriptHashDisplayFormat.HIDE,
            },
            result: {
                scriptHash: 'c6262ef9bb2b1291c058d93b46dabf458e2d135f803f60713f84b0b7',
            },
            legacyResults: [
                {
                    rules: ['<2.4.3', '1'],
                    payload: false,
                },
            ],
        },
        {
            description: 'INVALID_HEREAFTER script',
            params: {
                script: {
                    type: CardanoNativeScriptType.ALL,
                    scripts: [
                        {
                            type: CardanoNativeScriptType.PUB_KEY,
                            keyHash: 'c4b9265645fde9536c0795adbcc5291767a0c61fd62448341d7e0386',
                        },
                        {
                            type: CardanoNativeScriptType.INVALID_HEREAFTER,
                            invalidHereafter: '200',
                        },
                    ],
                },
                displayFormat: CardanoNativeScriptHashDisplayFormat.HIDE,
            },
            result: {
                scriptHash: 'b12ac304f89f4cd4d23f59a2b90d2b2697f7540b8f470d6aa05851b5',
            },
            legacyResults: [
                {
                    rules: ['<2.4.3', '1'],
                    payload: false,
                },
            ],
        },
        {
            description: 'Nested script',
            params: {
                script: {
                    type: CardanoNativeScriptType.ALL,
                    scripts: [
                        {
                            type: CardanoNativeScriptType.PUB_KEY,
                            keyHash: 'c4b9265645fde9536c0795adbcc5291767a0c61fd62448341d7e0386',
                        },
                        {
                            type: CardanoNativeScriptType.PUB_KEY,
                            keyPath: "m/1854'/1815'/0'/0/0",
                        },
                        {
                            type: CardanoNativeScriptType.ANY,
                            scripts: [
                                {
                                    type: CardanoNativeScriptType.PUB_KEY,
                                    keyPath: "m/1854'/1815'/0'/0/0",
                                },
                                {
                                    type: CardanoNativeScriptType.PUB_KEY,
                                    keyHash:
                                        '0241f2d196f52a92fbd2183d03b370c30b6960cfdeae364ffabac889',
                                },
                            ],
                        },
                        {
                            type: CardanoNativeScriptType.N_OF_K,
                            requiredSignaturesCount: 2,
                            scripts: [
                                {
                                    type: CardanoNativeScriptType.PUB_KEY,
                                    keyPath: "m/1854'/1815'/0'/0/0",
                                },
                                {
                                    type: CardanoNativeScriptType.PUB_KEY,
                                    keyHash:
                                        '0241f2d196f52a92fbd2183d03b370c30b6960cfdeae364ffabac889',
                                },
                                {
                                    type: CardanoNativeScriptType.PUB_KEY,
                                    keyHash:
                                        'cecb1d427c4ae436d28cc0f8ae9bb37501a5b77bcc64cd1693e9ae20',
                                },
                            ],
                        },
                        {
                            type: CardanoNativeScriptType.INVALID_BEFORE,
                            invalidBefore: '100',
                        },
                        {
                            type: CardanoNativeScriptType.INVALID_HEREAFTER,
                            invalidHereafter: '200',
                        },
                    ],
                },
                displayFormat: CardanoNativeScriptHashDisplayFormat.HIDE,
            },
            result: {
                scriptHash: '4a6b4288459bf34668c0b281f922691460caf0c7c09caee3a726c27a',
            },
            legacyResults: [
                {
                    rules: ['<2.4.3', '1'],
                    payload: false,
                },
            ],
        },
    ],
};
