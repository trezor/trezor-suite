import { TrezorDevice } from '@suite-common/suite-types';
import TrezorConnect, { DeviceUniquePath } from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';

import { TrezorConnectService, createTrezorConnectService } from '../trezorConnectService';

export const createDefaultMockDevice = (overrides: Partial<TrezorDevice> = {}): TrezorDevice =>
    ({
        id: 'mock-device-id',
        path: '1/3/3' as DeviceUniquePath,
        name: '',
        label: '',
        metadata: {},
        passwords: {},
        useEmptyPassphrase: false,
        ts: 1233131231123,
        firstConnectedTimestamp: 13221312131,
        buttonRequests: [],
        availableTranslations: [],
        unavailableCapabilities: {},
        instance: 1,
        features: {
            major_version: 1,
            minor_version: 2,
            patch_version: 3,
            bootloader_mode: null,
            passphrase_protection: false,
            revision: null,
            bootloader_hash: null,
            pin_protection: false,
            initialized: true,
            language: 'en',
            flags: 0,
            model: '',
            fw_major: 0,
            session_id: null,
            passphrase_always_on_device: false,
            safety_checks: 'PromptAlways',
            auto_lock_delay_ms: 0,
            unfinished_backup: false,
            no_backup: false,
            recovery_status: null,
            capabilities: [],
            display_rotation: 'North',
            experimental_features: false,
            internal_model: DeviceModelInternal.T2B1,
            backup_type: null,
            sd_card_present: false,
            sd_protection: false,
            wipe_code_protection: false,
            fw_minor: 0,
            fw_patch: 0,
            fw_vendor: '',
            imported: false,
            unlocked: false,
            firmware_present: false,
            backup_availability: 'NotAvailable',
            device_id: 'mock-device-id',
            label: 'lbl',
            vendor: 'test-vnedor',
        },
        connected: true,
        available: true,
        mode: 'normal',
        firmware: 'valid',
        status: 'available',
        type: 'acquired',
        state: {
            staticSessionId: 'mock-session-id@mock-id:2' as const,
        },
        ...overrides,
    }) as unknown as TrezorDevice;

export const createMockTrezorConnect = (
    {
        overrides,
        deviceOverrides,
    }: {
        overrides: Partial<typeof TrezorConnect>;
        deviceOverrides: Partial<TrezorDevice>;
    } = {
        overrides: {},
        deviceOverrides: {},
    },
) => {
    const mockDevice = createDefaultMockDevice(deviceOverrides);
    const mockTrezorConnect = {
        getDeviceState: jest.fn().mockImplementation(() =>
            Promise.resolve({
                success: true as const,
                payload: {
                    state: 'mock-device-state',
                },
                device: mockDevice,
            }),
        ),
        applySettings: jest.fn().mockImplementation(() =>
            Promise.resolve({
                success: true as const,
                payload: {
                    message: 'Settings applied',
                },
                device: mockDevice,
            }),
        ),
        on: jest.fn(),
        off: jest.fn(),
        cancel: jest.fn(),
        uiResponse: jest.fn(),
        ...overrides,
    } as unknown as jest.Mocked<typeof TrezorConnect>;

    return mockTrezorConnect;
};

export const createMockTrezorConnectService = (
    implementation: typeof TrezorConnect = createMockTrezorConnect(),
): TrezorConnectService => createTrezorConnectService(implementation);
