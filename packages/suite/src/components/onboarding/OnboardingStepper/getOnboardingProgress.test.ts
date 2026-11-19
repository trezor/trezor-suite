import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { DeviceModelInternal } from '@trezor/device-utils';

import { getOnboardingProgress } from './getOnboardingProgress';

describe(getOnboardingProgress.name, () => {
    it.each([
        {
            model: DeviceModelInternal.T3B1,
            steps: [
                'security-check',
                'firmware',
                'authenticate-device',
                'tutorial',
                'create-or-recover',
            ],
            progress: [1 / 5, 2 / 5, 3 / 5, 4 / 5, 1],
        },
        {
            model: DeviceModelInternal.T1B1,
            steps: ['security-check', 'firmware', 'create-or-recover'],
            progress: [1 / 3, 2 / 3, 1],
        },
        {
            model: DeviceModelInternal.T2T1,
            steps: ['security-check', 'firmware', 'create-or-recover'],
            progress: [1 / 3, 2 / 3, 1],
        },
    ] as const)(
        'counts the manual check as the first Device substep for $model',
        ({ model, steps, progress }) => {
            expect(
                steps.map(
                    activeStepId =>
                        getOnboardingProgress({
                            activeStepId,
                            device: mockSuiteDevice(
                                { connected: true, available: true },
                                { internal_model: model },
                            ),
                            onboardingPath: [],
                            isDeviceAuthenticityCheckEnabled: true,
                            isUnlockedBootloaderAllowed: false,
                        }).device,
                ),
            ).toEqual(progress);
        },
    );

    it.each([
        {
            model: DeviceModelInternal.T3B1,
            enabled: false,
            minor: 8,
            step: 'tutorial',
            expected: 3 / 4,
        },
        {
            model: DeviceModelInternal.T3T1,
            enabled: true,
            minor: 7,
            step: 'authenticate-device',
            expected: 3 / 4,
        },
        {
            model: DeviceModelInternal.T3T1,
            enabled: false,
            minor: 7,
            step: 'firmware',
            expected: 2 / 3,
        },
    ] as const)(
        'normalizes Device progress to available steps ($model, $step)',
        ({ model, enabled, minor, step, expected }) => {
            expect(
                getOnboardingProgress({
                    activeStepId: step,
                    device: mockSuiteDevice(
                        {},
                        {
                            internal_model: model,
                            major_version: 2,
                            minor_version: minor,
                            patch_version: 0,
                        },
                    ),
                    onboardingPath: [],
                    isDeviceAuthenticityCheckEnabled: enabled,
                    isUnlockedBootloaderAllowed: false,
                }).device,
            ).toBe(expected);
        },
    );

    it.each(['normal', 'bootloader'] as const)(
        'keeps DAC in the planned steps during %s mode',
        mode => {
            expect(
                getOnboardingProgress({
                    activeStepId: 'firmware',
                    device: mockSuiteDevice(
                        { mode, connected: true, available: true },
                        { internal_model: DeviceModelInternal.T3B1 },
                    ),
                    onboardingPath: [],
                    isDeviceAuthenticityCheckEnabled: true,
                    isUnlockedBootloaderAllowed: false,
                }).device,
            ).toBe(2 / 5);
        },
    );

    it.each([true, false])(
        'keeps Safe 5 progress stable across first firmware installation with DAC enabled=%s',
        isDeviceAuthenticityCheckEnabled => {
            const devices = [
                mockSuiteDevice(
                    { mode: 'bootloader', firmware: 'none' },
                    {
                        internal_model: DeviceModelInternal.T3T1,
                        initialized: false,
                        firmware_present: false,
                        fw_major: null,
                        fw_minor: null,
                        fw_patch: null,
                    },
                ),
                mockSuiteDevice(
                    { mode: 'bootloader', firmware: 'valid' },
                    {
                        internal_model: DeviceModelInternal.T3T1,
                        initialized: false,
                        firmware_present: true,
                        fw_major: 2,
                        fw_minor: 8,
                        fw_patch: 0,
                    },
                ),
                mockSuiteDevice(
                    { mode: 'initialize', firmware: 'valid' },
                    {
                        internal_model: DeviceModelInternal.T3T1,
                        initialized: false,
                        major_version: 2,
                        minor_version: 8,
                        patch_version: 0,
                    },
                ),
            ];
            const progress = devices.map(
                device =>
                    getOnboardingProgress({
                        activeStepId: 'firmware',
                        device,
                        onboardingPath: [],
                        isDeviceAuthenticityCheckEnabled,
                        isUnlockedBootloaderAllowed: false,
                    }).device,
            );

            const expected = isDeviceAuthenticityCheckEnabled ? 2 / 5 : 2 / 4;
            expect(progress).toEqual([expected, expected, expected]);
        },
    );

    it('omits DAC when an unlocked bootloader is allowed', () => {
        expect(
            getOnboardingProgress({
                activeStepId: 'tutorial',
                device: mockSuiteDevice(
                    { connected: true, available: true },
                    { internal_model: DeviceModelInternal.T3B1, bootloader_locked: false },
                ),
                onboardingPath: [],
                isDeviceAuthenticityCheckEnabled: true,
                isUnlockedBootloaderAllowed: true,
            }).device,
        ).toBe(3 / 4);
    });
});
