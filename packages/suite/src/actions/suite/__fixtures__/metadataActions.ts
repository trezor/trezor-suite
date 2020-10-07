import { METADATA, SUITE } from '@suite-actions/constants';

const setDeviceMetadataKey = [
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
    // {
    //     description: `Device metadata cancelled`,
    //     initialState: {
    //         metadata: { enabled: true },
    //         device: { state: 'device-state', metadata: { status: 'cancelled' } },
    //     },
    // },
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
        result: [
            {
                type: METADATA.SET_DEVICE_METADATA,
                payload: {
                    metadata: {
                        status: 'cancelled',
                    },
                },
            },
            {
                type: SUITE.UPDATE_SELECTED_DEVICE,
                payload: {
                    state: 'device-state',
                    metadata: { status: 'cancelled' },
                },
            },
            {
                type: METADATA.DISABLE,
            },
        ],
    },
    {
        description: `Master key successfully generated`,
        initialState: {
            metadata: { enabled: true },
            device: { state: 'device-state', metadata: { status: 'disabled' } },
        },
        result: [
            {
                type: METADATA.SET_DEVICE_METADATA,
                payload: {
                    metadata: {
                        status: 'enabled',
                    },
                },
            },
            {
                type: SUITE.UPDATE_SELECTED_DEVICE,
            },
        ],
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
        result: [
            {
                type: METADATA.SET_DEVICE_METADATA,
                payload: {
                    deviceState: 'device-state',
                    metadata: {
                        aesKey: 'bc37a9a8c6cfa6ab2f75b384df2745895d75f2c572a195ccff59ae9958aaf0e8',
                        fileName:
                            'c734ff5106c4910aa3444f3672cc2c82d8cb4595f0527be672d8b100ed82908f',
                        key: '20c8bf0701213cdcf4c2f56fd0096c1772322d42fb9c4d0ddf6bb122d713d2f3',
                        status: 'enabled',
                    },
                },
            },
            {
                type: SUITE.UPDATE_SELECTED_DEVICE,
                payload: {
                    metadata: {
                        aesKey: 'bc37a9a8c6cfa6ab2f75b384df2745895d75f2c572a195ccff59ae9958aaf0e8',
                        fileName:
                            'c734ff5106c4910aa3444f3672cc2c82d8cb4595f0527be672d8b100ed82908f',
                        key: '20c8bf0701213cdcf4c2f56fd0096c1772322d42fb9c4d0ddf6bb122d713d2f3',
                        status: 'enabled',
                    },
                    state: 'device-state',
                },
            },
        ],
    },
];

const setAccountMetadataKey = [
    {
        description: `Device without master key`,
        initialState: {
            device: { metadata: { status: 'disabled' } },
        },
        account: { key: 'account-key' },
        result: { key: 'account-key' },
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

const addDeviceMetadata = [
    // {
    //     description: `Without provider`,
    //     initialState: {
    //         metadata: {},
    //     },
    //     params: {},
    // },
    // {
    //     description: `Unknown provider`,
    //     initialState: {
    //         metadata: { provider: { type: 'unknown-provider' } },
    //     },
    //     params: {},
    //     result: undefined,
    // },
    {
        description: `Without device`,
        initialState: {
            metadata: { provider: { type: 'dropbox', key: 'A' } },
            device: { state: undefined },
        },
        params: { type: 'walletLabel', deviceState: 'device-state' },
        result: undefined,
    },
    {
        description: `Add walletLabel`,
        initialState: {
            metadata: { provider: { type: 'dropbox', key: 'A' } },
            device: {
                state: 'device-state',
                metadata: {
                    aesKey: 'eb0f1f0238c7fa8018c6101f4e887b871ce07b99d01d5ea57089b82f93149557',
                    fileName: '039fe833cba71d84b7bf4c99d44468ee48e311e741cbfcd6daf5263f584ef9f6',
                    key: 'CKValue',
                    status: 'enabled',
                },
            },
        },
        params: { type: 'walletLabel', deviceState: 'device-state', value: 'Custom label' },
        result: {
            type: METADATA.WALLET_ADD,
            payload: { deviceState: 'device-state', walletLabel: 'Custom label' },
        },
    },
];

const addAccountMetadata = [
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

const fetchMetadata = [
    {
        description: `Without provider`,
        initialState: {
            metadata: undefined,
        },
        result: undefined,
    },
    {
        description: 'Metadata not enabled',
        initialState: {
            metadata: {
                enabled: true,
                provider: {
                    token: 'foo',
                    type: 'google',
                    user: 'batman',
                },
            },
            device: { state: 'device-state', metadata: { status: 'cancelled' } },
            accounts: [],
        },
        params: 'device-state',
    },
    {
        description: 'Metadata enabled - decode device metadata',
        initialState: {
            metadata: {
                enabled: true,
                provider: { type: 'dropbox', user: 'User Name', token: 'oauth-token' },
            },
            device: {
                state: 'mkUHEWSY9zaq4A4RjicJSPSPPxZ1dr2CfF@B45F1224E1EFDEE921BE328F:undefined',
                metadata: {
                    status: 'enabled',
                    aesKey: 'f2734778f6b87864a02fc1e0ad2c69fcfc1160d86fff43b5acbef6f90772cba1',
                },
            },
        },
        params: 'mkUHEWSY9zaq4A4RjicJSPSPPxZ1dr2CfF@B45F1224E1EFDEE921BE328F:undefined',
        result: [
            {
                type: '@metadata/wallet-loaded',
                payload: {
                    deviceState:
                        'mkUHEWSY9zaq4A4RjicJSPSPPxZ1dr2CfF@B45F1224E1EFDEE921BE328F:undefined',
                    walletLabel: 'k',
                },
            },
        ],
    },
    // todo: decode account metadata
];

const connectProvider = [
    {
        description: 'Dropbox',
        initialState: {
            metadata: undefined,
        },
        params: 'dropbox',
        result: [
            {
                type: '@metadata/set-provider',
                payload: { type: 'dropbox', token: 'token-haf-mnau', user: 'haf' },
            },
        ],
    },
    // todo: google provider
    // todo: singleton (instance) behavior
];

const addMetadata = [
    {
        description: 'device without state',
        initialState: {
            metadata: { enabled: true },
            device: {
                state: undefined,
            },
        },
        params: {},
        result: [],
    },
    {
        description: 'does not need update',
        initialState: {
            metadata: {
                enabled: true,
                provider: { type: 'dropbox', user: 'User Name', token: 'oauth-token' },
            },
            device: {
                state: 'mmcGdEpTPqgQNRHqf3gmB5uDsEoPo2d3tp@46CE52D1ED50A900687D6BA2:undefined',
                metadata: { status: 'enabled' },
            },
        },
        params: {
            accountKey: 'account-key',
            defaultValue: "m/84'/0'/0'",
            type: 'accountLabel',
            value: undefined,
        },
        result: [],
    },
    {
        description: 'value from input === original value',
        initialState: {
            metadata: {
                enabled: true,
                provider: { type: 'dropbox', user: 'User Name', token: 'oauth-token' },
            },
            device: {
                state: 'mmcGdEpTPqgQNRHqf3gmB5uDsEoPo2d3tp@46CE52D1ED50A900687D6BA2:undefined',
                metadata: { status: 'enabled' },
            },
        },
        params: {
            accountKey: 'account-key',
            defaultValue: "m/84'/0'/0'",
            type: 'accountLabel',
            value: 'my label', // see store setup in tests
        },
        result: [],
    },
];

export const enableMetadata = [
    {
        description: 'enable metadata',
        initialState: {
            metadata: { enabled: true },
        },
        result: [
            {
                type: METADATA.ENABLE,
            },
        ],
    },
];

export const disableMetadata = [
    {
        description: 'disable metadata',
        initialState: {
            metadata: { enabled: true },
            device: {
                state: undefined,
            },
        },
        result: [
            {
                type: METADATA.DISABLE,
            },
        ],
    },
];

const initMetadata = [
    {
        description: 'device without state',
        initialState: {
            device: { state: undefined },
        },
        result: [],
    },
    {
        description: 'metadata already enabled',
        initialState: {
            device: { state: 'device-state', metadata: { status: 'enabled' } },
            metadata: { enabled: true, provider: { type: 'dropbox' } },
        },
        result: [],
    },
    {
        description: 'metadata not enabled',
        initialState: {
            device: { state: 'device-state', metadata: { status: 'disabled' } },
            metadata: { enabled: false },
            suite: { online: true },
        },
        params: true,
        result: [
            { type: '@metadata/enable' },
            { type: '@metadata/set-initiating', payload: true },
            {
                type: '@metadata/set-device-metadata',
                payload: { deviceState: 'device-state' },
            },
            {
                type: '@suite/update-selected-device',
                payload: { state: 'device-state' },
            },
            {
                type: '@modal/open-user-context',
                payload: { type: 'metadata-provider' },
            },
            {
                type: '@metadata/set-provider',
                payload: { type: 'dropbox', token: 'token', user: 'power-user' },
            },
            {
                type: '@metadata/wallet-loaded',
                payload: { deviceState: 'device-state', walletLabel: '' },
            },
            {
                type: '@suite/update-selected-device',
                payload: { state: 'device-state' },
            },
            { type: '@metadata/set-initiating', payload: false },
        ],
    },
];

export {
    setDeviceMetadataKey,
    setAccountMetadataKey,
    addDeviceMetadata,
    addAccountMetadata,
    fetchMetadata,
    connectProvider,
    addMetadata,
    initMetadata,
};
