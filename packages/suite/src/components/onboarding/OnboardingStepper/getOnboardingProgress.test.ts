import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { DeviceModelInternal } from '@trezor/device-utils';

import { type AnyStepId } from '#src/types/onboarding';

import { getOnboardingProgress } from './getOnboardingProgress';

type GetDeviceProgressParams = {
    activeStepId: AnyStepId;
    device: TrezorDevice;
    isDeviceAuthenticityCheckEnabled?: boolean;
    isUnlockedBootloaderAllowed?: boolean;
};

const getDeviceProgress = ({
    activeStepId,
    device,
    isDeviceAuthenticityCheckEnabled = true,
    isUnlockedBootloaderAllowed = false,
}: GetDeviceProgressParams) =>
    getOnboardingProgress({
        activeStepId,
        device,
        onboardingPath: [],
        isDeviceAuthenticityCheckEnabled,
        isUnlockedBootloaderAllowed,
    }).device;

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
            const device = mockSuiteDevice(
                { connected: true, available: true },
                { internal_model: model },
            );

            expect(steps.map(activeStepId => getDeviceProgress({ activeStepId, device }))).toEqual(
                progress,
            );
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
                getDeviceProgress({
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
                    isDeviceAuthenticityCheckEnabled: enabled,
                }),
            ).toBe(expected);
        },
    );

    it.each([
        { model: DeviceModelInternal.T3B1, majorVersion: 2, expected: 2 / 5 },
        { model: DeviceModelInternal.T1B1, majorVersion: 1, expected: 2 / 3 },
        { model: DeviceModelInternal.T2T1, majorVersion: 2, expected: 2 / 3 },
    ])(
        'keeps the planned Device steps in bootloader mode on $model',
        ({ model, majorVersion, expected }) => {
            expect(
                getDeviceProgress({
                    activeStepId: 'firmware',
                    device: mockSuiteDevice(
                        { mode: 'bootloader', connected: true, available: true },
                        {
                            internal_model: model,
                            initialized: false,
                            firmware_present: true,
                            major_version: majorVersion,
                        },
                    ),
                }),
            ).toBe(expected);
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
            const progress = devices.map(device =>
                getDeviceProgress({
                    activeStepId: 'firmware',
                    device,
                    isDeviceAuthenticityCheckEnabled,
                }),
            );

            const expected = isDeviceAuthenticityCheckEnabled ? 2 / 5 : 2 / 4;
            expect(progress).toEqual([expected, expected, expected]);
        },
    );

    it('omits DAC when an unlocked bootloader is allowed', () => {
        expect(
            getDeviceProgress({
                activeStepId: 'tutorial',
                device: mockSuiteDevice(
                    { connected: true, available: true },
                    { internal_model: DeviceModelInternal.T3B1, bootloader_locked: false },
                ),
                isUnlockedBootloaderAllowed: true,
            }),
        ).toBe(3 / 4);
    });
});
