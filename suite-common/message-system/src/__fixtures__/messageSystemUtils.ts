import { DeviceModelInternal, FirmwareType } from '@trezor/connect';
import { testMocks } from '@suite-common/test-utils';

const { getDeviceFeatures, getConnectDevice, getMessageSystemConfig } = testMocks;

export const createVersionRange = [
    {
        description: 'createVersionRange case 1',
        input: '!',
        result: null,
    },
    {
        description: 'createVersionRange case 2',
        input: undefined,
        result: null,
    },
    {
        description: 'createVersionRange case 3',
        input: '',
        result: '',
    },
    {
        description: 'createVersionRange case 4',
        input: '15.0.0',
        result: '15.0.0',
    },
    {
        description: 'createVersionRange case 5',
        input: ['15.0.0'],
        result: '15.0.0',
    },
    {
        description: 'createVersionRange case 6',
        input: ['16', '<13', '18.x'],
        result: '16 || <13 || 18.x',
    },
];

export const validateDurationCompatibility = [
    {
        description: 'validateDurationCompatibility case 1',
        durationCondition: {
            from: '2021-03-01T12:10:00.000Z',
            to: '2022-03-01T12:10:00.000Z',
        },
        currentDate: '2021-03-01T12:10:00.000Z',
        result: true,
    },
    {
        description: 'validateDurationCompatibility case 2',
        durationCondition: {
            from: '2021-03-01T12:10:00.000Z',
            to: '2022-03-01T12:10:00.000Z',
        },
        currentDate: '2021-03-01T12:09:00.000Z',
        result: false,
    },
    {
        description: 'validateDurationCompatibility case 3',
        durationCondition: {
            from: '2021-03-01T12:09:00.000Z',
            to: '2022-03-01T12:10:00.000Z',
        },
        currentDate: '2022-03-01T12:10:00.000Z',
        result: true,
    },
    {
        description: 'validateDurationCompatibility case 4',
        durationCondition: {
            from: '2021-03-01T12:09:00.000Z',
            to: '2022-03-01T12:10:00.000Z',
        },
        currentDate: '2022-03-01T12:10:00.001Z',
        result: false,
    },
    {
        description: 'validateDurationCompatibility case 5',
        durationCondition: {
            from: '2021-03-01T12:09:00.000Z',
            to: '2022-03-01T12:10:00.000Z',
        },
        currentDate: '2021-05-01T12:10:00.001Z',
        result: true,
    },
];

export const validateSettingsCompatibility = [
    {
        description: 'validateSettingsCompatibility case 1',
        settingsCondition: [{ ltc: true }],
        currentSettings: { tor: false, enabledNetworks: ['ltc'] },
        result: true,
    },
    {
        description: 'validateSettingsCompatibility case 2',
        settingsCondition: [{ ltc: true }],
        currentSettings: { tor: true, enabledNetworks: [] },
        result: false,
    },
    {
        description: 'validateSettingsCompatibility case 3',
        settingsCondition: [{ ltc: false }],
        currentSettings: { tor: false, enabledNetworks: ['ltc'] },
        result: false,
    },
    {
        description: 'validateSettingsCompatibility case 4',
        settingsCondition: [{ ltc: false }],
        currentSettings: { tor: true, enabledNetworks: [] },
        result: true,
    },
    {
        description: 'validateSettingsCompatibility case 5',
        settingsCondition: [{}],
        currentSettings: { tor: false, enabledNetworks: ['ltc'] },
        result: true,
    },
    {
        description: 'validateSettingsCompatibility case 6',
        settingsCondition: [{}],
        currentSettings: { tor: true, enabledNetworks: [] },
        result: true,
    },
    {
        description: 'validateSettingsCompatibility case 7',
        settingsCondition: [{ tor: true }],
        currentSettings: { tor: true, enabledNetworks: ['ltc'] },
        result: true,
    },
    {
        description: 'validateSettingsCompatibility case 8',
        settingsCondition: [{ tor: false }],
        currentSettings: { tor: false, enabledNetworks: ['ltc', 'btc'] },
        result: true,
    },
    {
        description: 'validateSettingsCompatibility case 9',
        settingsCondition: [
            { tor: true, btc: false },
            { tor: false, ltc: true },
        ],
        currentSettings: { tor: false, enabledNetworks: ['ltc', 'btc'] },
        result: true,
    },
    {
        description: 'validateSettingsCompatibility case 10',
        settingsCondition: [{ tor: true, btc: false }, { tor: true }],
        currentSettings: { tor: true, enabledNetworks: [] },
        result: true,
    },
    {
        description: 'validateSettingsCompatibility case 11',
        settingsCondition: [
            { tor: true, ltc: true },
            { tor: false, ltc: false },
        ],
        currentSettings: { tor: false, enabledNetworks: [] },
        result: true,
    },
    {
        description: 'validateSettingsCompatibility case 12',
        settingsCondition: [
            { tor: true, ltc: true },
            { tor: false, ltc: false, btc: true },
            { tor: false, ltc: true, eth: false },
        ],
        currentSettings: { tor: false, enabledNetworks: ['btc'] },
        result: true,
    },
];

export const validateVersionCompatibility = [
    {
        description: 'os validateVersionCompatibility case 1',
        condition: {
            windows: '*',
            linux: '<=15.2',
            macos: ['14', '15', '18'],
            android: '!',
            ios: '!',
            chromeos: '*',
        },
        type: 'windows',
        version: '10.0.0',
        result: true,
    },
    {
        description: 'os validateVersionCompatibility case 2',
        condition: {
            windows: '*',
            linux: '<=15.2',
            macos: ['14', '15', '18'],
            android: '!',
            ios: '!',
            chromeos: '*',
        },
        type: 'linux',
        version: '15.2.3',
        result: true,
    },
    {
        description: 'os validateVersionCompatibility case 3',
        condition: {
            windows: '*',
            linux: '<=15.2',
            macos: ['14', '15', '18'],
            android: '!',
            ios: '!',
            chromeos: '*',
        },
        type: 'linux',
        version: '15.3.1',
        result: false,
    },
    {
        description: 'os validateVersionCompatibility case 4',
        condition: {
            windows: '*',
            linux: '<=15.2',
            macos: ['14', '15.3.1', '>18'],
            android: '!',
            ios: '!',
            chromeos: '*',
        },
        type: 'macos',
        version: '15.3.0',
        result: false,
    },
    {
        description: 'os validateVersionCompatibility case 5',
        condition: {
            windows: '*',
            linux: '<=15.2',
            macos: ['14', '15.3.1', '>18'],
            android: '!',
            ios: '!',
            chromeos: '*',
        },
        type: 'macos',
        version: '19.0.0',
        result: true,
    },
    {
        description: 'os validateVersionCompatibility case 6',
        condition: {
            windows: '*',
            linux: '<=15.2',
            macos: ['14', '15.3.1', '>18'],
            android: '!',
            ios: '!',
            chromeos: '*',
        },
        type: 'android',
        version: '10.2.3',
        result: false,
    },
    {
        description: 'os validateVersionCompatibility case 7',
        condition: {
            windows: '*',
            linux: '<=15.2',
            macos: ['14', '15.3.1', '>18'],
            android: '!',
            ios: '!',
            chromeos: '*',
        },
        type: 'blackberry',
        version: '11.3.2',
        result: false,
    },
    {
        description: 'os validateVersionCompatibility case 8',
        condition: {
            windows: '*',
            linux: '<=15.2',
            macos: ['14', '15.3.1', '>18'],
            android: '!',
            ios: '!',
            chromeos: '14150',
        },
        type: 'chromeos',
        version: '14150.64.0',
        result: true,
    },
    {
        description: 'os validateVersionCompatibility case 9',
        condition: {
            windows: '*',
            linux: '<=15.2',
            macos: ['14', '15.3.1', '>18'],
            android: '!',
            ios: '!',
            chromeos: '14150',
        },
        type: 'chromeos',
        version: '14149.64.0',
        result: false,
    },
    {
        description: 'os validateVersionCompatibility case 10',
        condition: {
            windows: '*',
            linux: '<=15.2',
            macos: ['14', '15.3.1', '>18'],
            android: '!',
            ios: '!',
            chromeos: '!',
        },
        type: 'chromeos',
        version: '14149.64.0',
        result: false,
    },
    {
        description: 'browser validateVersionCompatibility case 1',
        condition: {
            chrome: '~14',
            firefox: 'v2',
            chromium: ['34'],
        },
        type: 'chrome',
        version: '14.3.2',
        result: true,
    },
    {
        description: 'browser validateVersionCompatibility case 2',
        condition: {
            chrome: '~14',
            firefox: 'v2',
            chromium: ['34'],
        },
        type: 'chrome',
        version: '13.0.0',
        result: false,
    },
    {
        description: 'browser validateVersionCompatibility case 3',
        condition: {
            chrome: '~14',
            firefox: 'v2',
            chromium: ['34'],
        },
        type: 'firefox',
        version: '13.0.0',
        result: false,
    },
    {
        description: 'browser validateVersionCompatibility case 4',
        condition: {
            chrome: '~14',
            firefox: 'v2',
            chromium: ['34'],
        },
        type: 'firefox',
        version: '2.8.12',
        result: true,
    },
    {
        description: 'browser validateVersionCompatibility case 5',
        condition: {
            chrome: '~14',
            firefox: 'v2',
            chromium: ['34'],
        },
        type: 'firefox',
        version: '2.8.12',
        result: true,
    },
    {
        description: 'browser validateVersionCompatibility case 6',
        condition: {
            chrome: '~14',
            firefox: 'v2',
            chromium: ['34'],
        },
        type: 'chromium',
        version: '34.0.2',
        result: true,
    },
];

export const validateEnvironmentCompatibility = [
    {
        description: 'validateEnvironmentCompatibility case 1',
        condition: {
            web: '',
            desktop: '0',
            mobile: '!',
        },
        type: 'web',
        version: '3.0.0',
        result: true,
    },
    {
        description: 'validateEnvironmentCompatibility case 2',
        condition: {
            web: '',
            desktop: '0',
            mobile: '!',
        },
        type: 'web',
        version: null,
        result: false,
    },
    {
        description: 'validateEnvironmentCompatibility case 3',
        condition: {
            web: '',
            desktop: '0',
            mobile: '!',
        },
        commitHash: 'fa8eab',
        type: 'desktop',
        version: '0.0.1',
        result: true,
    },
    {
        description: 'validateEnvironmentCompatibility case 4',
        condition: {
            web: '',
            desktop: '0',
            mobile: '!',
        },
        type: 'mobile',
        version: '0.0.1',
        result: false,
    },
    {
        description: 'validateEnvironmentCompatibility case 5',
        condition: {
            web: '*',
            desktop: '!',
            mobile: '!',
            revision: 'fa8eab',
        },
        commitHash: 'fa8eab',
        type: 'web',
        version: '22.2.2',
        result: true,
    },
    {
        description: 'validateEnvironmentCompatibility case 6',
        condition: {
            web: '*',
            desktop: '!',
            mobile: '!',
            revision: 'fa8eab',
        },
        commitHash: 'hahhah',
        type: 'web',
        version: '22.2.2',
        result: false,
    },
    {
        description: 'validateEnvironmentCompatibility case 7',
        condition: {
            web: '*',
            desktop: '!',
            mobile: '!',
            revision: 'fa8eab',
        },
        commitHash: undefined,
        type: 'web',
        version: '22.2.2',
        result: false,
    },
];

export const validateTransportCompatibility = [
    {
        description: 'validateTransportCompatibility case 1',
        transportCondition: {
            bridge: ['2.0.27', '2.0.28'],
            webusbplugin: '*',
        },
        transport: {
            type: 'bridge',
            version: '2.0.27',
        },
        result: true,
    },
    {
        description: 'validateTransportCompatibility case 2',
        transportCondition: {
            bridge: ['2.0.27', '2.0.28'],
            webusbplugin: '*',
        },
        transport: undefined,
        result: false,
    },
    {
        description: 'validateTransportCompatibility case 3',
        transportCondition: {
            bridge: '*',
            webusbplugin: '*',
        },
        transport: {
            type: 'bridge',
            version: '2.0.27',
        },
        result: true,
    },
    {
        description: 'validateTransportCompatibility case 4',
        transportCondition: {
            bridge: ['2.0.27', '2.0.28'],
            webusbplugin: '*',
        },
        transport: {
            type: 'tunnel',
            version: '2.0.27',
        },
        result: false,
    },
    {
        description: 'validateTransportCompatibility case 5',
        transportCondition: {
            bridge: '2',
            webusbplugin: '*',
        },
        transport: {
            type: 'bridge',
            version: '2.0.25',
        },
        result: true,
    },
    {
        description: 'validateTransportCompatibility case 6',
        transportCondition: {
            bridge: '2',
            webusbplugin: '*',
        },
        transport: {
            type: 'bridge',
        },
        result: false,
    },
    {
        description: 'validateTransportCompatibility case 7',
        transportCondition: {
            bridge: '2',
            webusbplugin: '*',
        },
        transport: {
            version: '2.0.0',
        },
        result: false,
    },
    {
        description: 'validateTransportCompatibility case 8',
        transportCondition: {
            bridge: '2',
            webusbplugin: '2',
        },
        transport: {
            type: 'WebUsbPlugin',
            version: '2.0.0',
        },
        result: true,
    },
    {
        description: 'validateTransportCompatibility case 9',
        transportCondition: {
            bridge: '2',
            webusbplugin: '1.9.2',
        },
        transport: {
            type: 'WebUsbPlugin',
            version: '1.9.3',
        },
        result: false,
    },
];

export const validateDeviceCompatibility = [
    {
        description: 'validateDeviceCompatibility case 1',
        deviceConditions: [
            {
                model: DeviceModelInternal.T2T1,
                firmware: '2.1.3',
                bootloader: '*',
                firmwareRevision: '*',
                variant: '*',
                vendor: 'trezor.io',
            },
        ],
        device: {
            features: {
                ...getDeviceFeatures({
                    vendor: 'trezor.io',
                    internal_model: DeviceModelInternal.T2T1,
                    major_version: 2,
                    minor_version: 1,
                    patch_version: 3,
                    capabilities: ['Capability_Bitcoin_like'],
                }),
                firmwareType: FirmwareType.Regular,
            },
        },
        result: true,
    },
    {
        description: 'validateDeviceCompatibility case 2',
        deviceConditions: [
            {
                model: DeviceModelInternal.T1B1,
                firmware: ['1', '2'],
                bootloader: '*',
                firmwareRevision: '*',
                variant: FirmwareType.BitcoinOnly,
                vendor: 'trezor.io',
            },
            {
                model: DeviceModelInternal.T2T1,
                firmware: ['3.0'],
                bootloader: '*',
                firmwareRevision: '*',
                variant: FirmwareType.Regular,
                vendor: 'trezor.io',
            },
        ],
        device: {
            features: {
                ...getDeviceFeatures({
                    vendor: 'trezor.io',
                    internal_model: DeviceModelInternal.T1B1,
                    major_version: 1,
                    minor_version: 2,
                    patch_version: 8,
                    capabilities: ['Capability_Bitcoin'],
                }),
            },
            firmwareType: FirmwareType.BitcoinOnly,
        },
        result: true,
    },
    {
        description: 'validateDeviceCompatibility case 3',
        deviceConditions: [
            {
                model: DeviceModelInternal.T2T1,
                firmware: '1',
                bootloader: '*',
                firmwareRevision: '*',
                variant: '*',
                vendor: 'trezor.io',
            },
        ],
        device: {
            features: {
                ...getDeviceFeatures({
                    vendor: 'ledger',
                    internal_model: DeviceModelInternal.T2T1,
                    major_version: 1,
                    minor_version: 0,
                    patch_version: 2,
                    capabilities: ['Capability_Bitcoin_like'],
                }),
            },
            firmwareType: FirmwareType.Regular,
        },
        result: false,
    },
    {
        description: 'validateDeviceCompatibility case 4',
        deviceConditions: [
            {
                model: DeviceModelInternal.T2T1,
                firmware: '1',
                bootloader: '*',
                firmwareRevision: '*',
                variant: FirmwareType.Regular,
                vendor: 'trezor.io',
            },
        ],
        device: {
            features: {
                ...getDeviceFeatures({
                    vendor: 'trezor.io',
                    internal_model: DeviceModelInternal.T1B1,
                    major_version: 1,
                    minor_version: 0,
                    patch_version: 2,
                    capabilities: ['Capability_Bitcoin_like'],
                }),
            },
            firmwareType: FirmwareType.Regular,
        },
        result: false,
    },
    {
        description: 'validateDeviceCompatibility case 5',
        deviceConditions: [
            {
                model: DeviceModelInternal.T2T1,
                firmware: '2',
                bootloader: '*',
                firmwareRevision: '*',
                variant: FirmwareType.Regular,
                vendor: 'trezor.io',
            },
        ],
        device: {
            features: {
                ...getDeviceFeatures({
                    vendor: 'trezor.io',
                    internal_model: DeviceModelInternal.T1B1,
                    major_version: 1,
                    minor_version: 0,
                    patch_version: 2,
                    capabilities: ['Capability_Bitcoin_like'],
                }),
            },
            firmwareType: FirmwareType.Regular,
        },
        result: false,
    },
    {
        description: 'validateDeviceCompatibility case 6',
        deviceConditions: [],
        device: {
            features: {
                ...getDeviceFeatures({
                    vendor: 'trezor.io',
                    internal_model: DeviceModelInternal.T1B1,
                    major_version: 1,
                    minor_version: 0,
                    patch_version: 2,
                }),
            },
            firmwareType: FirmwareType.Regular,
        },
        result: false,
    },
    {
        description: 'validateDeviceCompatibility case 7',
        deviceConditions: [
            {
                model: DeviceModelInternal.T2T1,
                firmware: '2',
                bootloader: '*',
                firmwareRevision: '*',
                variant: FirmwareType.Regular,
                vendor: 'trezor.io',
            },
        ],
        device: {},
        result: false,
    },
    {
        description: 'validateDeviceCompatibility case 8',
        deviceConditions: [],
        device: undefined,
        result: true,
    },
    {
        description: 'validateDeviceCompatibility case 9',
        deviceConditions: [
            {
                model: DeviceModelInternal.T1B1,
                firmware: '1',
                bootloader: '*',
                firmwareRevision: '*',
                variant: '*',
                vendor: 'trezor.io',
            },
        ],
        device: {
            features: {
                ...getDeviceFeatures({
                    vendor: 'trezor.io',
                    internal_model: DeviceModelInternal.T1B1,
                    major_version: 1,
                    minor_version: 0,
                    patch_version: 2,
                    capabilities: ['Capability_Bitcoin'],
                }),
            },
            firmwareType: FirmwareType.BitcoinOnly,
        },
        result: true,
    },
    {
        description: 'validateDeviceCompatibility case 10',
        deviceConditions: [
            {
                model: DeviceModelInternal.T1B1,
                firmware: '1',
                bootloader: '*',
                firmwareRevision: '*',
                variant: FirmwareType.Regular,
                vendor: 'trezor.io',
            },
        ],
        device: {
            features: {
                ...getDeviceFeatures({
                    vendor: 'trezor.io',
                    internal_model: DeviceModelInternal.T1B1,
                    major_version: 1,
                    minor_version: 0,
                    patch_version: 2,
                    capabilities: ['Capability_Bitcoin'],
                }),
            },
            firmwareType: FirmwareType.BitcoinOnly,
        },
        result: false,
    },
    {
        description: 'validateDeviceCompatibility case 11',
        deviceConditions: [
            {
                model: DeviceModelInternal.T1B1,
                firmware: '1',
                bootloader: '*',
                firmwareRevision: '*',
                variant: FirmwareType.BitcoinOnly,
                vendor: 'trezor.io',
            },
        ],
        device: {
            features: {
                ...getDeviceFeatures({
                    vendor: 'trezor.io',
                    internal_model: DeviceModelInternal.T1B1,
                    major_version: 1,
                    minor_version: 0,
                    patch_version: 2,
                    capabilities: ['Capability_Bitcoin_like'],
                }),
            },
            firmwareType: FirmwareType.Regular,
        },
        result: false,
    },
    {
        description: 'validateDeviceCompatibility case 12',
        deviceConditions: [
            {
                model: DeviceModelInternal.T1B1,
                firmware: '1',
                bootloader: '*',
                firmwareRevision: '*',
                variant: '*',
                vendor: '*',
            },
        ],
        device: {
            features: {
                ...getDeviceFeatures({
                    vendor: 'trevor.io',
                    internal_model: DeviceModelInternal.T1B1,
                    major_version: 1,
                    minor_version: 0,
                    patch_version: 2,
                    capabilities: ['Capability_Bitcoin_like'],
                }),
            },
            firmwareType: FirmwareType.Regular,
        },
        result: true,
    },
    {
        description: 'validateDeviceCompatibility case 13',
        deviceConditions: [
            {
                model: DeviceModelInternal.T1B1,
                firmware: '1',
                bootloader: '*',
                firmwareRevision: '*',
                variant: '*',
                vendor: 'trezor.io',
            },
        ],
        device: {
            features: {
                ...getDeviceFeatures({
                    vendor: 'trevor.io',
                    internal_model: DeviceModelInternal.T1B1,
                    major_version: 1,
                    minor_version: 0,
                    patch_version: 2,
                    capabilities: ['Capability_Bitcoin_like'],
                }),
            },
            firmwareType: FirmwareType.Regular,
        },
        result: false,
    },
    {
        description: 'validateDeviceCompatibility case 14',
        deviceConditions: [
            {
                model: DeviceModelInternal.T1B1,
                firmware: '1',
                bootloader: '*',
                firmwareRevision: '*',
                variant: '*',
                vendor: '*',
            },
        ],
        device: {
            features: {
                ...getDeviceFeatures({
                    vendor: 'trevor.io',
                    internal_model: DeviceModelInternal.T1B1,
                    major_version: 1,
                    minor_version: 0,
                    patch_version: 2,
                    revision: 'fa8eha',
                }),
            },
            firmwareType: FirmwareType.Regular,
        },
        result: true,
    },
    {
        description: 'validateDeviceCompatibility case 15',
        deviceConditions: [
            {
                model: DeviceModelInternal.T1B1,
                firmware: '1',
                bootloader: '*',
                firmwareRevision: 'fa8eha',
                variant: '*',
                vendor: '*',
            },
        ],
        device: {
            features: {
                ...getDeviceFeatures({
                    vendor: 'trevor.io',
                    internal_model: DeviceModelInternal.T1B1,
                    major_version: 1,
                    minor_version: 0,
                    patch_version: 2,
                    revision: 'fa8eha',
                }),
            },
            firmwareType: FirmwareType.Regular,
        },
        result: true,
    },
    {
        description: 'validateDeviceCompatibility case 16',
        deviceConditions: [
            {
                model: DeviceModelInternal.T1B1,
                firmware: '1',
                bootloader: '*',
                firmwareRevision: 'abcdef',
                variant: '*',
                vendor: '*',
            },
        ],
        device: {
            features: {
                ...getDeviceFeatures({
                    vendor: 'trevor.io',
                    internal_model: DeviceModelInternal.T1B1,
                    major_version: 1,
                    minor_version: 0,
                    patch_version: 2,
                    revision: 'fa8eha',
                }),
            },
            firmwareType: FirmwareType.Regular,
        },
        result: false,
    },
    {
        description: 'validateDeviceCompatibility case 17',
        deviceConditions: [
            {
                model: DeviceModelInternal.T2T1,
                firmware: '*',
                bootloader: '2.0.4',
                firmwareRevision: '*',
                variant: '*',
                vendor: 'trezor.io',
            },
        ],
        device: {
            features: {
                ...getDeviceFeatures({
                    vendor: 'trezor.io',
                    internal_model: DeviceModelInternal.T2T1,
                    major_version: 2,
                    minor_version: 0,
                    patch_version: 4,
                    bootloader_mode: true,
                }),
            },
            firmwareType: FirmwareType.Regular,
        },
        result: true,
    },
    {
        description: 'validateDeviceCompatibility case 18',
        deviceConditions: [
            {
                model: DeviceModelInternal.T2T1,
                firmware: '*',
                bootloader: '2.0.4',
                firmwareRevision: '*',
                variant: '*',
                vendor: '*',
            },
        ],
        device: {
            features: {
                ...getDeviceFeatures({
                    vendor: '*',
                    internal_model: DeviceModelInternal.T2T1,
                    major_version: 2,
                    minor_version: 0,
                    patch_version: 3,
                    bootloader_mode: true,
                }),
            },
            firmwareType: FirmwareType.Regular,
        },
        result: false,
    },
    {
        description: 'validateDeviceCompatibility case 19',
        deviceConditions: [
            {
                model: DeviceModelInternal.T2T1,
                firmware: '*',
                bootloader: '2.0.4',
                firmwareRevision: '*',
                variant: '*',
                vendor: '*',
            },
        ],
        device: {
            features: {
                ...getDeviceFeatures({
                    vendor: '*',
                    internal_model: DeviceModelInternal.T2T1,
                    major_version: 2,
                    minor_version: 0,
                    patch_version: 4,
                    bootloader_mode: false,
                }),
            },
            firmwareType: FirmwareType.Regular,
        },
        result: false,
    },
    {
        description: 'validateDeviceCompatibility case 20',
        deviceConditions: [
            {
                model: DeviceModelInternal.T2T1,
                firmware: '*',
                bootloader: '2.0.4',
                firmwareRevision: 'fa8e42',
                variant: '*',
                vendor: '*',
            },
        ],
        device: {
            features: {
                ...getDeviceFeatures({
                    vendor: '*',
                    internal_model: DeviceModelInternal.T2T1,
                    major_version: 2,
                    minor_version: 0,
                    patch_version: 4,
                    revision: null,
                    bootloader_mode: false,
                }),
            },
            firmwareType: FirmwareType.Regular,
        },
        result: false,
    },
    {
        description: 'validateDeviceCompatibility case 21',
        deviceConditions: [
            {
                model: DeviceModelInternal.T2T1,
                firmware: '2.4.5',
                bootloader: '2.0.4',
                firmwareRevision: '*',
                variant: '*',
                vendor: '*',
            },
        ],
        device: {
            features: {
                ...getDeviceFeatures({
                    vendor: '*',
                    internal_model: DeviceModelInternal.T2T1,
                    major_version: 2,
                    minor_version: 0,
                    patch_version: 4,
                    fw_major: 2,
                    fw_minor: 4,
                    fw_patch: 5,
                    bootloader_mode: true,
                }),
            },
            firmwareType: FirmwareType.Regular,
        },
        result: true,
    },
    {
        description: 'validateDeviceCompatibility case 22',
        deviceConditions: [
            {
                model: DeviceModelInternal.T2T1,
                firmware: '2.4.5',
                bootloader: '2.0.4',
                firmwareRevision: '*',
                variant: '*',
                vendor: '*',
            },
        ],
        device: {
            features: {
                ...getDeviceFeatures({
                    vendor: '*',
                    internal_model: DeviceModelInternal.T2T1,
                    major_version: 2,
                    minor_version: 0,
                    patch_version: 4,
                    fw_major: 2,
                    fw_minor: 4,
                    fw_patch: 4,
                    bootloader_mode: true,
                }),
            },
            firmwareType: FirmwareType.Regular,
        },
        result: false,
    },
    {
        description: 'validateDeviceCompatibility case 23',
        deviceConditions: [
            {
                model: DeviceModelInternal.T2T1,
                firmware: '2.4.5',
                bootloader: '2.0.3',
                firmwareRevision: '*',
                variant: '*',
                vendor: '*',
            },
        ],
        device: {
            features: {
                ...getDeviceFeatures({
                    vendor: '*',
                    internal_model: DeviceModelInternal.T2T1,
                    major_version: 2,
                    minor_version: 0,
                    patch_version: 4,
                    fw_major: 2,
                    fw_minor: 4,
                    fw_patch: 5,
                    bootloader_mode: true,
                }),
            },
            firmwareType: FirmwareType.Regular,
        },
        result: false,
    },
    {
        description: 'validateDeviceCompatibility case 24',
        deviceConditions: [
            {
                model: DeviceModelInternal.T2B1,
                firmware: '2.6.0',
                bootloader: '2.1.5',
                firmwareRevision: '*',
                variant: '*',
                vendor: 'trezor.io',
            },
        ],
        device: {
            features: {
                ...getDeviceFeatures({
                    vendor: 'trezor.io',
                    internal_model: DeviceModelInternal.T2B1,
                    major_version: 2,
                    minor_version: 1,
                    patch_version: 5,
                    fw_major: 2,
                    fw_minor: 6,
                    fw_patch: 0,
                    bootloader_mode: true,
                }),
            },
            firmwareType: FirmwareType.Regular,
        },
        result: true,
    },
    {
        description: 'validateDeviceCompatibility case 25',
        deviceConditions: [
            {
                model: DeviceModelInternal.T2B1,
                firmware: '2',
                bootloader: '*',
                firmwareRevision: '123456',
                variant: '*',
                vendor: 'trezor.io',
            },
        ],
        device: {
            features: {
                ...getDeviceFeatures({
                    vendor: 'trezor.io',
                    internal_model: DeviceModelInternal.T2B1,
                    major_version: 2,
                    minor_version: 6,
                    patch_version: 0,
                    revision: '123456',
                }),
            },
            firmwareType: FirmwareType.Regular,
        },
        result: true,
    },
    {
        description: 'validateDeviceCompatibility case 26',
        deviceConditions: [
            {
                model: 'T',
                firmware: '2',
                bootloader: '*',
                firmwareRevision: '123456',
                variant: '*',
                vendor: 'trezor.io',
            },
            {
                model: DeviceModelInternal.T2T1,
                firmware: '2',
                bootloader: '*',
                firmwareRevision: '123456',
                variant: '*',
                vendor: 'trezor.io',
            },
        ],
        device: {
            features: {
                ...getDeviceFeatures({
                    vendor: 'trezor.io',
                    internal_model: DeviceModelInternal.T2T1,
                    major_version: 2,
                    minor_version: 6,
                    patch_version: 0,
                    revision: '123456',
                }),
            },
            firmwareType: FirmwareType.Regular,
        },
        result: true,
    },
    {
        description: 'validateDeviceCompatibility case 27',
        deviceConditions: [
            {
                model: '1',
                firmware: '1',
                bootloader: '*',
                firmwareRevision: '123456',
                variant: '*',
                vendor: 'trezor.io',
            },
        ],
        device: {
            features: {
                ...getDeviceFeatures({
                    vendor: 'trezor.io',
                    internal_model: DeviceModelInternal.T1B1,
                    major_version: 1,
                    minor_version: 10,
                    patch_version: 0,
                    revision: '123456',
                }),
            },
            firmwareType: FirmwareType.Regular,
        },
        result: false,
    },
    {
        description: 'validateDeviceCompatibility case 26',
        deviceConditions: [
            {
                model: DeviceModelInternal.T1B1,
                firmware: '1',
                bootloader: '*',
                firmwareRevision: '123456',
                variant: '*',
                vendor: 'trezor.io',
            },
        ],
        device: {
            features: {
                ...getDeviceFeatures({
                    vendor: 'trezor.io',
                    model: '1',
                    major_version: 1,
                    minor_version: 10,
                    patch_version: 0,
                    revision: '123456',
                }),
            },
            firmwareType: FirmwareType.Regular,
        },
        result: false,
    },
];

export const getValidMessages = [
    {
        description: 'getValidMessages case 1',
        currentDate: '',
        userAgent: '',
        osName: '',
        environment: '',
        suiteVersion: '',
        config: null,
        options: {},
        result: [],
    },
    {
        description: 'getValidMessages case 2',
        currentDate: '',
        userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36',
        osName: 'macos',
        environment: '',
        suiteVersion: '',
        config: getMessageSystemConfig(),
        options: {},
        result: [getMessageSystemConfig().actions[1].message],
    },
    {
        description: 'getValidMessages case 3',
        currentDate: '2021-04-01T12:10:00.000Z',
        userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36',
        osName: 'macos',
        environment: '',
        suiteVersion: '',
        config: getMessageSystemConfig(undefined, undefined, {
            conditions: [
                { duration: { from: '2021-03-01T12:10:00.000Z', to: '2021-03-05T12:10:00.000Z' } },
            ],
        }),
        options: {},
        result: [],
    },
    {
        description: 'getValidMessages case 4',
        currentDate: '2021-04-01T12:10:00.000Z',
        userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36',
        osName: 'macos',
        environment: '',
        suiteVersion: '',
        config: getMessageSystemConfig(undefined, undefined, {
            conditions: [
                { duration: { from: '2021-03-01T12:10:00.000Z', to: '2021-05-01T12:10:00.000Z' } },
            ],
        }),
        options: {},
        result: [getMessageSystemConfig().actions[1].message],
    },
    {
        description: 'getValidMessages case 5',
        currentDate: '2021-04-01T12:10:00.000Z',
        userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36',
        osName: 'macos',
        environment: '',
        suiteVersion: '',
        config: getMessageSystemConfig(undefined, undefined, {
            conditions: [
                { duration: { from: '2021-03-01T12:10:00.000Z', to: '2021-05-01T12:10:00.000Z' } },
            ],
        }),
        options: {},
        result: [getMessageSystemConfig().actions[1].message],
    },
    {
        description: 'getValidMessages case 6',
        currentDate: '2021-04-01T12:10:00.000Z',
        userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36',
        osName: 'macos',
        environment: 'web',
        suiteVersion: '1.4.5',
        config: getMessageSystemConfig(undefined, undefined, {
            conditions: [
                {
                    duration: { from: '2021-03-01T12:10:00.000Z', to: '2021-05-01T12:10:00.000Z' },
                    environment: {
                        web: '>=1.4.4 <1.4.8',
                        desktop: '*',
                        mobile: '!',
                    },
                },
            ],
        }),
        options: { settings: { tor: false, enabledNetworks: [] } },
        result: [getMessageSystemConfig().actions[1].message],
    },
    {
        description: 'getValidMessages case 7',
        currentDate: '2021-04-01T12:10:00.000Z',
        userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36',
        osName: 'macos',
        environment: 'web',
        suiteVersion: '2.4.5',
        config: getMessageSystemConfig(undefined, undefined, {
            conditions: [
                {
                    duration: { from: '2021-03-01T12:10:00.000Z', to: '2021-05-01T12:10:00.000Z' },
                    environment: {
                        web: '>=2.4.4 <2.4.5',
                        desktop: '*',
                        mobile: '!',
                    },
                },
            ],
        }),
        options: { settings: { tor: false, enabledNetworks: [] } },
        result: [],
    },
    {
        description: 'getValidMessages case 8',
        currentDate: '',
        userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36',
        osName: 'macos',
        environment: '',
        suiteVersion: '',
        config: getMessageSystemConfig(undefined, undefined, {
            conditions: [
                {
                    os: {
                        macos: ['10.14', '10.18', '11'],
                        linux: '<20.04',
                        windows: '!',
                        android: '*',
                        ios: '13',
                        chromeos: '!',
                    },
                },
            ],
        }),
        options: {},
        result: [getMessageSystemConfig().actions[1].message],
    },
    {
        description: 'getValidMessages case 9',
        currentDate: '',
        userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36',
        osName: 'macos',
        environment: '',
        suiteVersion: '',
        config: getMessageSystemConfig(undefined, undefined, {
            conditions: [
                {
                    os: {
                        macos: '!',
                        linux: '<20.04',
                        windows: '!',
                        android: '*',
                        ios: '13',
                        chromeos: '!',
                    },
                },
            ],
        }),
        options: {},
        result: [],
    },
    {
        description: 'getValidMessages case 10',
        currentDate: '',
        userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36',
        osName: 'macos',
        environment: 'web',
        suiteVersion: '',
        config: getMessageSystemConfig(undefined, undefined, {
            conditions: [
                {
                    browser: {
                        chrome: '*',
                        firefox: '!',
                        chromium: '10',
                    },
                },
            ],
        }),
        options: {},
        result: [getMessageSystemConfig().actions[1].message],
    },
    {
        description: 'getValidMessages case 11',
        currentDate: '',
        userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36',
        osName: 'macos',
        environment: 'desktop',
        suiteVersion: '',
        config: getMessageSystemConfig(undefined, undefined, {
            conditions: [
                {
                    browser: {
                        chrome: '*',
                        firefox: '!',
                        chromium: '10',
                    },
                },
            ],
        }),
        options: {},
        result: [getMessageSystemConfig().actions[1].message],
    },
    {
        description: 'getValidMessages case 12',
        currentDate: '',
        userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36',
        osName: 'macos',
        environment: 'web',
        suiteVersion: '',
        config: getMessageSystemConfig(undefined, undefined, {
            conditions: [
                {
                    browser: {
                        chrome: '88',
                        firefox: '!',
                        chromium: '10',
                    },
                },
            ],
        }),
        options: {},
        result: [],
    },
    {
        description: 'getValidMessages case 13',
        currentDate: '',
        userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36',
        osName: 'macos',
        environment: '',
        suiteVersion: '',
        config: getMessageSystemConfig(undefined, undefined, {
            conditions: [
                {
                    settings: [{ tor: true }],
                },
            ],
        }),
        options: { settings: { tor: false, enabledNetworks: [] } },
        result: [],
    },
    {
        description: 'getValidMessages case 14',
        currentDate: '',
        userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36',
        osName: 'macos',
        environment: '',
        suiteVersion: '',
        config: getMessageSystemConfig(undefined, undefined, {
            conditions: [
                {
                    settings: [{ tor: false, btc: true }],
                },
            ],
        }),
        options: { settings: { tor: false, enabledNetworks: ['btc'] } },
        result: [getMessageSystemConfig().actions[1].message],
    },
    {
        description: 'getValidMessages case 15',
        currentDate: '',
        userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36',
        osName: 'macos',
        environment: '',
        suiteVersion: '',
        config: getMessageSystemConfig(undefined, undefined, {
            conditions: [
                {
                    transport: {
                        bridge: '2',
                        webusbplugin: '2',
                    },
                },
            ],
        }),
        options: {
            settings: { tor: false, enabledNetworks: [] },
            transport: { type: 'bridge', version: '2.3.4' },
        },
        result: [getMessageSystemConfig().actions[1].message],
    },
    {
        description: 'getValidMessages case 16',
        currentDate: '',
        userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36',
        osName: 'macos',
        environment: '',
        suiteVersion: '',
        config: getMessageSystemConfig(undefined, undefined, {
            conditions: [
                {
                    transport: {
                        bridge: '1',
                        webusbplugin: '2',
                    },
                },
            ],
        }),
        options: {
            settings: { tor: false, enabledNetworks: [] },
            transport: { type: 'bridge', version: '2.3.4' },
        },
        result: [],
    },
    {
        description: 'getValidMessages case 17',
        currentDate: '',
        userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36',
        osName: 'macos',
        environment: '',
        suiteVersion: '',
        config: getMessageSystemConfig(undefined, undefined, {
            conditions: [
                {
                    devices: [
                        {
                            model: DeviceModelInternal.T1B1,
                            firmware: '1.0.2',
                            firmwareRevision: '*',
                            bootloader: '*',
                            variant: '*',
                            vendor: 'trezor.io',
                        },
                        {
                            model: DeviceModelInternal.T2T1,
                            firmware: '2.1.1',
                            firmwareRevision: '*',
                            bootloader: '*',
                            variant: '*',
                            vendor: 'trezor.io',
                        },
                    ],
                },
            ],
        }),
        options: {
            settings: { tor: false, enabledNetworks: [] },
            device: getConnectDevice(),
        },
        result: [getMessageSystemConfig().actions[1].message],
    },
    {
        description: 'getValidMessages case 18',
        currentDate: '',
        userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36',
        osName: 'macos',
        environment: '',
        suiteVersion: '',
        config: getMessageSystemConfig(undefined, undefined, {
            conditions: [
                {
                    devices: [
                        {
                            model: DeviceModelInternal.T2T1,
                            firmware: '2.2.1',
                            firmwareRevision: '*',
                            bootloader: '*',
                            variant: '*',
                            vendor: 'trezor.io',
                        },
                    ],
                },
            ],
        }),
        options: {
            settings: { tor: false, enabledNetworks: [] },
            device: getConnectDevice(),
        },
        result: [],
    },
    {
        description: 'getValidMessages case 19',
        currentDate: '',
        userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36',
        osName: 'macos',
        environment: '',
        suiteVersion: '',
        config: getMessageSystemConfig(undefined, undefined, {
            conditions: [
                {
                    devices: [
                        {
                            model: DeviceModelInternal.T2T1,
                            firmware: '2.1.1',
                            firmwareRevision: '*',
                            bootloader: '*',
                            variant: FirmwareType.BitcoinOnly,
                            vendor: 'trezor.io',
                        },
                    ],
                },
            ],
        }),
        options: {
            settings: { tor: false, enabledNetworks: [] },
            device: {
                ...getConnectDevice(undefined, {
                    capabilities: ['Capability_Bitcoin'],
                }),
            },
        },
        result: [getMessageSystemConfig().actions[1].message],
    },
    {
        description: 'getValidMessages case 20',
        currentDate: '',
        userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36',
        osName: 'macos',
        environment: '',
        suiteVersion: '',
        config: getMessageSystemConfig(undefined, undefined, {
            conditions: [
                {
                    devices: [
                        {
                            model: DeviceModelInternal.T2T1,
                            firmware: '2.1.1',
                            firmwareRevision: '*',
                            bootloader: '*',
                            variant: FirmwareType.Regular,
                            vendor: 'trezor.io',
                        },
                    ],
                },
            ],
        }),
        options: {
            settings: { tor: false, enabledNetworks: [] },
            device: {
                ...getConnectDevice(undefined, {
                    capabilities: ['Capability_Bitcoin_like'],
                }),
            },
        },
        result: [getMessageSystemConfig().actions[1].message],
    },
    {
        description: 'getValidMessages case 21',
        currentDate: '2021-04-01T12:10:00.000Z',
        userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36',
        osName: 'macos',
        environment: 'web',
        suiteVersion: '2.0.0',
        config: getMessageSystemConfig(),
        options: {
            settings: { tor: true, enabledNetworks: ['btc'] },
            transport: { type: 'bridge', version: '2.0.30' },
            device: getConnectDevice(),
        },
        result: getMessageSystemConfig().actions.map(action => action.message),
    },
    {
        description: 'getValidMessages case 22',
        currentDate: '',
        userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36',
        osName: 'macos',
        environment: '',
        suiteVersion: '',
        config: getMessageSystemConfig(undefined, undefined, {
            conditions: [
                {
                    devices: [
                        {
                            model: DeviceModelInternal.T2T1,
                            firmware: '*',
                            firmwareRevision: 'fae8ac',
                            bootloader: '2.0.4',
                            variant: FirmwareType.BitcoinOnly,
                            vendor: 'trezor.io',
                        },
                    ],
                },
            ],
        }),
        options: {
            settings: { tor: false, enabledNetworks: [] },
            device: {
                ...getConnectDevice(undefined, {
                    capabilities: ['Capability_Bitcoin'],
                    revision: 'fae8ac',
                    bootloader_mode: true,
                    internal_model: DeviceModelInternal.T2T1,
                    major_version: 2,
                    minor_version: 0,
                    patch_version: 4,
                }),
            },
        },
        result: [getMessageSystemConfig().actions[1].message],
    },
];
