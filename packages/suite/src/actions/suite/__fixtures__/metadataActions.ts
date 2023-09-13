import { deviceActions } from '@suite-common/wallet-core';

import { METADATA } from 'src/actions/suite/constants';

const setDeviceMetadataKey = [
    {
        description: `Metadata not enabled`,
        initialState: {
            metadata: { enabled: false, providers: [] },
        },
    },
    {
        description: `Device without state`,
        initialState: {
            metadata: { enabled: true, providers: [] },
            device: { state: undefined },
        },
    },
    {
        description: `Device not connected (remembered)`,
        initialState: {
            metadata: { enabled: true, providers: [] },
            device: { state: 'device-state', connected: false, metadata: { status: 'disabled' } },
        },
    },
    {
        description: `Device metadata already enabled`,
        initialState: {
            metadata: { enabled: true, providers: [] },
            device: { state: 'device-state', metadata: { status: 'enabled' } },
        },
    },
    {
        description: `Master key cancelled`,
        connect: {
            success: false,
        },
        initialState: {
            metadata: { enabled: true, providers: [] },
            device: { state: 'device-state', connected: true, metadata: { status: 'disabled' } },
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
                type: deviceActions.updateSelectedDevice.type,
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
            metadata: { enabled: true, providers: [] },
            device: { state: 'device-state', connected: true, metadata: { status: 'disabled' } },
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
                type: deviceActions.updateSelectedDevice.type,
            },
        ],
    },
    {
        description: `Master key successfully generated, provider already connected`,
        initialState: {
            metadata: {
                enabled: true,
                selectedProvider: { labels: '' },
                providers: [
                    {
                        type: 'dropbox',
                        user: 'User Name',
                        tokens: { refreshToken: 'oauth-token' },
                        providers: [],
                    },
                ],
            },
            device: { state: 'device-state', connected: true, metadata: { status: 'disabled' } },
        },
        result: [
            {
                type: METADATA.SET_DEVICE_METADATA,
                payload: {
                    deviceState: 'device-state',
                    metadata: {
                        1: {
                            fileName:
                                'c734ff5106c4910aa3444f3672cc2c82d8cb4595f0527be672d8b100ed82908f.mtdt',
                            aesKey: 'bc37a9a8c6cfa6ab2f75b384df2745895d75f2c572a195ccff59ae9958aaf0e8',
                            key: '20c8bf0701213cdcf4c2f56fd0096c1772322d42fb9c4d0ddf6bb122d713d2f3',
                        },
                        status: 'enabled',
                    },
                },
            },
            {
                type: deviceActions.updateSelectedDevice.type,
                payload: {
                    metadata: {
                        1: {
                            aesKey: 'bc37a9a8c6cfa6ab2f75b384df2745895d75f2c572a195ccff59ae9958aaf0e8',
                            fileName:
                                'c734ff5106c4910aa3444f3672cc2c82d8cb4595f0527be672d8b100ed82908f.mtdt',
                            key: '20c8bf0701213cdcf4c2f56fd0096c1772322d42fb9c4d0ddf6bb122d713d2f3',
                        },
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
        description: `Device without master key - account fileName and aesKey can't be computed`,
        initialState: {
            device: { metadata: { status: 'disabled', providers: [] } },
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
                    providers: [],
                },
            },
        },
        account: {
            metadata: {
                key: 'xpub6CVKsQYXc9awxgV1tWbG4foDvdcnieK2JkbpPEBKB5WwAPKBZ1mstLbKVB4ov7QzxzjaxNK6EfmNY5Jsk2cG26EVcEkycGW4tchT2dyUhrx',
            },
        },
        result: {
            metadata: {
                key: 'xpub6CVKsQYXc9awxgV1tWbG4foDvdcnieK2JkbpPEBKB5WwAPKBZ1mstLbKVB4ov7QzxzjaxNK6EfmNY5Jsk2cG26EVcEkycGW4tchT2dyUhrx',
            },
        },
    },
];

const addDeviceMetadata = [
    {
        description: `Without device`,
        initialState: {
            metadata: { selectedProvider: { type: 'dropbox', key: 'A' }, providers: [] },
            device: { state: undefined },
        },
        params: { type: 'walletLabel', deviceState: 'device-state' },
        result: undefined,
    },
    {
        description: `Add walletLabel`,
        initialState: {
            metadata: { selectedProvider: { type: 'dropbox', key: 'A' }, providers: [] },
            device: {
                state: 'device-state',
                metadata: {
                    1: {
                        aesKey: 'eb0f1f0238c7fa8018c6101f4e887b871ce07b99d01d5ea57089b82f93149557',
                        fileName:
                            '039fe833cba71d84b7bf4c99d44468ee48e311e741cbfcd6daf5263f584ef9f6',
                    },
                    key: 'CKValue',
                    status: 'enabled',
                },
            },
        },
        params: { type: 'walletLabel', deviceState: 'device-state', value: 'Custom label' },
        result: {},
    },
];

const addAccountMetadata = [
    {
        description: `Without provider`,
        initialState: {
            metadata: {
                providers: [],
            },
        },
        params: {},
        result: undefined,
    },
    {
        description: `Without account`,
        initialState: {
            metadata: {
                selectedProvider: { labels: 'clientId' },
                providers: [{ type: 'dropbox', data: {}, clientId: 'clientId' }],
            },
        },
        params: {},
        result: undefined,
    },
    {
        description: `add outputLabel`,
        initialState: {
            metadata: {
                selectedProvider: { labels: 'clientId' },
                providers: [
                    {
                        type: 'dropbox',
                        data: {
                            a: {
                                outputLabels: {},
                                addressLabels: {},
                                accountLabel: '',
                            },
                        },
                        clientId: 'clientId',
                    },
                ],
            },
            device: {
                metadata: {
                    status: 'enabled',
                },
            },
            accounts: [
                {
                    metadata: {
                        [METADATA.ENCRYPTION_VERSION]: {
                            aesKey: '9bc3736f0b45cd681854a724b5bba67b9da1e50bc9983fd2dd56e53e74b75480',
                            fileName: 'a',
                        },
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
        result: [
            {
                type: '@metadata/set-data',
                payload: {
                    provider: {
                        type: 'dropbox',
                        data: { a: { outputLabels: {}, addressLabels: {}, accountLabel: '' } },
                        clientId: 'clientId',
                    },
                    data: {
                        a: {
                            outputLabels: { TXID: { '0': 'Foo' } },
                            addressLabels: {},
                            accountLabel: '',
                        },
                    },
                },
            },
        ],
    },
    {
        description: `remove outputLabel`,
        initialState: {
            metadata: {
                selectedProvider: { labels: 'clientId' },
                providers: [
                    {
                        type: 'dropbox',
                        data: {
                            'filename-123': {
                                outputLabels: {
                                    TXID: {
                                        0: 'Foo',
                                    },
                                },
                            },
                        },
                        clientId: 'clientId',
                    },
                ],
            },
            device: {
                metadata: { status: 'enabled', key: 'B' },
            },
            accounts: [
                {
                    metadata: {
                        1: {
                            aesKey: '9bc3736f0b45cd681854a724b5bba67b9da1e50bc9983fd2dd56e53e74b75480',
                            fileName: 'filename-123',
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
        result: [
            {
                payload: {
                    data: { 'filename-123': { outputLabels: {} } },
                    provider: {
                        clientId: 'clientId',
                        data: { 'filename-123': { outputLabels: { TXID: { '0': 'Foo' } } } },
                        type: 'dropbox',
                    },
                },
                type: '@metadata/set-data',
            },
        ],
    },
];

const connectProvider = [
    {
        description: 'Dropbox',
        initialState: {
            metadata: undefined,
        },
        params: { type: 'dropbox' },
        result: [
            {
                type: '@metadata/add-provider',
                payload: {
                    type: 'dropbox',
                    tokens: { refreshToken: 'token-haf-mnau' },
                    user: 'haf',
                    isCloud: true,
                    clientId: 'wg0yz2pbgjyhoda',
                    data: {},
                },
            },
            {
                payload: {
                    clientId: 'wg0yz2pbgjyhoda',
                    dataType: 'labels',
                },
                type: '@metadata/set-selected-provider',
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
            metadata: { enabled: true, providers: [] },
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
                selectedProvider: {
                    type: 'dropbox',
                    user: 'User Name',
                    tokens: { refreshToken: 'oauth-token' },
                },
                providers: [],
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
                selectedProvider: {
                    type: 'dropbox',
                    user: 'User Name',
                    tokens: { refreshToken: 'oauth-token' },
                },
                providers: [],
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
            metadata: { enabled: true, providers: [] },
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
            metadata: { enabled: true, providers: [] },
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

const init = [
    {
        description: 'device without state',
        initialState: {
            device: { state: undefined },
        },
        result: [{ type: '@metadata/enable' }],
    },
    {
        description: 'metadata already enabled',
        initialState: {
            device: { state: 'device-state', metadata: { status: 'enabled' } },
            metadata: { enabled: true, selectedProvider: {}, providers: [] },
        },
        result: [
            { type: '@metadata/set-initiating', payload: true },
            {
                type: '@modal/open-user-context',
                payload: { type: 'metadata-provider', decision: { promise: {} } },
            },
            {
                type: '@metadata/add-provider',
                payload: {
                    type: 'dropbox',
                    isCloud: true,
                    tokens: { refreshToken: 'token' },
                    user: 'power-user',
                    clientId: 'meow',
                    data: {},
                },
            },
            {
                type: '@metadata/set-selected-provider',
                payload: { dataType: 'labels', clientId: 'wg0yz2pbgjyhoda' },
            },
            { type: '@metadata/set-initiating', payload: false },
        ],
    },
    {
        description: 'metadata not enabled',
        initialState: {
            device: { state: 'device-state', connected: true, metadata: { status: 'disabled' } },
            metadata: { enabled: false, providers: [], selectedProvider: {} },
            suite: { online: true },
        },
        params: true,
        result: [
            { type: '@metadata/enable' },
            { type: '@metadata/set-initiating', payload: true },
            {
                type: '@metadata/set-device-metadata',
                payload: {
                    deviceState: 'device-state',
                    metadata: {
                        '1': {
                            fileName:
                                'c734ff5106c4910aa3444f3672cc2c82d8cb4595f0527be672d8b100ed82908f.mtdt',
                            aesKey: 'bc37a9a8c6cfa6ab2f75b384df2745895d75f2c572a195ccff59ae9958aaf0e8',
                            key: '20c8bf0701213cdcf4c2f56fd0096c1772322d42fb9c4d0ddf6bb122d713d2f3',
                        },
                        status: 'enabled',
                    },
                },
            },
            {
                type: deviceActions.updateSelectedDevice.type,
                payload: {
                    state: 'device-state',
                    connected: true,
                    metadata: {
                        '1': {
                            fileName:
                                'c734ff5106c4910aa3444f3672cc2c82d8cb4595f0527be672d8b100ed82908f.mtdt',
                            aesKey: 'bc37a9a8c6cfa6ab2f75b384df2745895d75f2c572a195ccff59ae9958aaf0e8',
                            key: '20c8bf0701213cdcf4c2f56fd0096c1772322d42fb9c4d0ddf6bb122d713d2f3',
                        },
                        status: 'enabled',
                    },
                },
            },
            {
                type: '@modal/open-user-context',
                payload: { type: 'metadata-provider', decision: { promise: {} } },
            },
            {
                type: '@metadata/add-provider',
                payload: {
                    type: 'dropbox',
                    isCloud: true,
                    tokens: { refreshToken: 'token' },
                    user: 'power-user',
                    clientId: 'meow',
                    data: {},
                },
            },
            {
                type: '@metadata/set-selected-provider',
                payload: { dataType: 'labels', clientId: 'wg0yz2pbgjyhoda' },
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
    connectProvider,
    addMetadata,
    init,
};
