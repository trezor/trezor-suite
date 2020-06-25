import { METADATA, MODAL } from '@suite-actions/constants';

export const getDeviceMetadataKey = [
    {
        description: `Metadata not enabled`,
        initialState: {
            metadata: { enabled: false },
        },
    },
    {
        description: `Device without state`,
        initialState: {
            metadata: { enabled: true },
            device: { state: undefined },
        },
    },
    {
        description: `Device metadata cancelled`,
        initialState: {
            metadata: { enabled: true },
            device: { state: 'device-state', metadata: { status: 'cancelled' } },
        },
    },
    {
        description: `Device metadata already enabled`,
        initialState: {
            metadata: { enabled: true },
            device: { state: 'device-state', metadata: { status: 'enabled' } },
        },
    },
    {
        description: `Master key cancelled`,
        connect: {
            success: false,
        },
        initialState: {
            metadata: { enabled: true },
            device: { state: 'device-state', metadata: { status: 'disabled' } },
        },
        result: {
            type: METADATA.SET_MASTER_KEY,
            payload: {
                metadata: {
                    status: 'cancelled',
                },
            },
        },
    },
    {
        description: `Master key successfully generated`,
        initialState: {
            metadata: { enabled: true },
            device: { state: 'device-state', metadata: { status: 'disabled' } },
        },
        result: {
            type: MODAL.OPEN_USER_CONTEXT,
        },
    },

    {
        description: `Master key successfully generated, provider already connected`,
        initialState: {
            metadata: {
                enabled: true,
                provider: { type: 'dropbox', user: 'User Name', token: 'oauth-token' },
            },
            device: { state: 'device-state', metadata: { status: 'disabled' } },
        },
        result: {
            type: METADATA.SET_MASTER_KEY,
            payload: {
                metadata: {
                    aesKey: 'eb0f1f0238c7fa8018c6101f4e887b871ce07b99d01d5ea57089b82f93149557',
                    fileName: '039fe833cba71d84b7bf4c99d44468ee48e311e741cbfcd6daf5263f584ef9f6',
                    key: 'CKValue',
                    status: 'enabled',
                },
            },
        },
    },
];

export const setAccountMetadataKey = [
    {
        description: `Device without master key`,
        initialState: {
            device: { metadata: { status: 'disabled' } },
        },
        account: { key: 'account-key' },
        result: { key: 'account-key' },
    },
    {
        description: `Device with invalid master key`,
        initialState: {
            device: { metadata: { status: 'enabled', key: { unexpected: 'key-format' } } },
        },
        account: { key: 'account-key', metadata: { key: 'A', fileName: '' } },
        result: { key: 'account-key', metadata: { key: 'A', fileName: '' } },
    },
    {
        description: `Account with invalid key`,
        initialState: {
            device: { metadata: { status: 'enabled', key: 'A' } },
        },
        account: { key: 'account-key', metadata: { key: undefined } },
        result: { key: 'account-key', metadata: { key: undefined } },
    },
    {
        description: `Account m/49'/0'/0'`,
        initialState: {
            device: {
                metadata: {
                    status: 'enabled',
                    key: '20c8bf0701213cdcf4c2f56fd0096c1772322d42fb9c4d0ddf6bb122d713d2f3',
                },
            },
        },
        account: {
            metadata: {
                key:
                    'xpub6CVKsQYXc9awxgV1tWbG4foDvdcnieK2JkbpPEBKB5WwAPKBZ1mstLbKVB4ov7QzxzjaxNK6EfmNY5Jsk2cG26EVcEkycGW4tchT2dyUhrx',
            },
        },
        result: {
            metadata: {
                fileName: '828652b66f2e6f919fbb7fe4c9609d4891ed531c6fac4c28441e53ebe577ac85',
                aesKey: '9bc3736f0b45cd681854a724b5bba67b9da1e50bc9983fd2dd56e53e74b75480',
            },
        },
    },
];

export const addDeviceMetadata = [
    {
        description: `Without provider`,
        initialState: {
            metadata: {},
        },
    },
    {
        description: `Unknown provider`,
        initialState: {
            metadata: { provider: { type: 'unknown-provider' } },
        },
        result: undefined,
    },
    {
        description: `Without device`,
        initialState: {
            metadata: { provider: { type: 'dropbox', key: 'A' } },
        },
        result: undefined,
    },
    {
        description: `Add walletLabel`,
        initialState: {
            metadata: { provider: { type: 'dropbox', key: 'A' } },
            device: {
                metadata: {
                    aesKey: 'eb0f1f0238c7fa8018c6101f4e887b871ce07b99d01d5ea57089b82f93149557',
                    fileName: '039fe833cba71d84b7bf4c99d44468ee48e311e741cbfcd6daf5263f584ef9f6',
                    key: 'CKValue',
                    status: 'enabled',
                },
            },
        },
        result: undefined,
    },
];

export const addAccountMetadata = [
    {
        description: `Without provider`,
        initialState: {
            metadata: {},
        },
        params: {},
        result: undefined,
    },
    {
        description: `Without account`,
        initialState: {
            metadata: { provider: { type: 'dropbox', key: 'A' } },
        },
        params: {},
        result: undefined,
    },
    {
        description: `add outputLabel`,
        initialState: {
            metadata: { provider: { type: 'dropbox', key: 'A' } },
            device: {
                metadata: { status: 'enabled', key: 'B' },
            },
            accounts: [
                {
                    metadata: {
                        aesKey: '9bc3736f0b45cd681854a724b5bba67b9da1e50bc9983fd2dd56e53e74b75480',
                        outputLabels: {},
                    },
                },
            ],
        },
        params: {
            type: 'outputLabel',
            txid: 'TXID',
            outputIndex: 0,
            value: 'Foo',
        },
        result: {
            type: METADATA.ACCOUNT_ADD,
            payload: {
                metadata: {
                    outputLabels: {
                        TXID: {
                            0: 'Foo',
                        },
                    },
                },
            },
        },
    },
    {
        description: `remove outputLabel`,
        initialState: {
            metadata: { provider: { type: 'dropbox', key: 'A' } },
            device: {
                metadata: { status: 'enabled', key: 'B' },
            },
            accounts: [
                {
                    metadata: {
                        aesKey: '9bc3736f0b45cd681854a724b5bba67b9da1e50bc9983fd2dd56e53e74b75480',
                        outputLabels: {
                            TXID: {
                                0: 'Foo',
                            },
                        },
                    },
                },
            ],
        },
        params: {
            type: 'outputLabel',
            txid: 'TXID',
            outputIndex: 0,
            value: '', // empty string removes value
        },
        result: {
            type: METADATA.ACCOUNT_ADD,
            payload: {
                metadata: {
                    outputLabels: {
                        TXID: {
                            0: 'Foo',
                        },
                    },
                },
            },
        },
    },
];

export const fetchMetadata = [
    {
        description: `Without provider`,
        initialState: {
            metadata: undefined,
        },
        result: undefined,
    },
];
