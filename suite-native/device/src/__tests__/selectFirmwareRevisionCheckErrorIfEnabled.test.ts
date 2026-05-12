import { messageSystemInitialState } from '@suite-common/message-system';
import { mockConnectDevice } from '@suite-common/suite-types/mocks';
import { type Device } from '@trezor/connect';

import { selectFirmwareRevisionCheckErrorIfEnabled } from '../selectors';

const baseState = {
    appSettings: {
        isOnboardingFinished: true,
        isDeviceAuthenticityCheckEnabled: true,
        isFirmwareRevisionCheckEnabled: true,
        isFirmwareHashCheckEnabled: true,
        areDeviceMetaChecksEnabled: true,
        areTestnetsEnabled: false,
        shouldShowAutoEjectAlert: false,
        hasAutoEjectAlertBeenDisplayed: false,
        isTronEnabled: false,
    },
    messageSystem: messageSystemInitialState,
} as Parameters<typeof selectFirmwareRevisionCheckErrorIfEnabled>[0];

describe('selectFirmwareRevisionCheckErrorIfEnabled', () => {
    it('returns null for a known device whose firmwareRevision check succeeded', () => {
        const device = mockConnectDevice() as Device;

        expect(selectFirmwareRevisionCheckErrorIfEnabled(baseState, device)).toBeNull();
    });

    it('returns the revision check error when device.authenticityChecks.firmwareRevision.success is false', () => {
        const device = mockConnectDevice() as Device;
        if (device.type !== 'acquired') throw new Error('expected acquired device');
        device.authenticityChecks = {
            ...device.authenticityChecks,
            firmwareRevision: { success: false, error: 'revision-mismatch' },
        };

        expect(selectFirmwareRevisionCheckErrorIfEnabled(baseState, device)).toBe(
            'revision-mismatch',
        );
    });

    it('returns null when isFirmwareRevisionCheckEnabled is disabled in app settings', () => {
        const device = mockConnectDevice() as Device;
        if (device.type !== 'acquired') throw new Error('expected acquired device');
        device.authenticityChecks = {
            ...device.authenticityChecks,
            firmwareRevision: { success: false, error: 'revision-mismatch' },
        };

        const disabledState = {
            ...baseState,
            appSettings: {
                ...baseState.appSettings,
                isFirmwareRevisionCheckEnabled: false,
            },
        };

        expect(selectFirmwareRevisionCheckErrorIfEnabled(disabledState, device)).toBeNull();
    });

    it('returns the same primitive across repeated calls when state and device are unchanged', () => {
        const device = mockConnectDevice() as Device;
        if (device.type !== 'acquired') throw new Error('expected acquired device');
        device.authenticityChecks = {
            ...device.authenticityChecks,
            firmwareRevision: { success: false, error: 'revision-mismatch' },
        };

        const first = selectFirmwareRevisionCheckErrorIfEnabled(baseState, device);
        const second = selectFirmwareRevisionCheckErrorIfEnabled(baseState, device);

        expect(first).toBe(second);
        expect(first).toBe('revision-mismatch');
    });

    it('caches distinct devices independently', () => {
        const okDevice = mockConnectDevice({ path: 'a' }) as Device;
        const errDevice = mockConnectDevice({ path: 'b' }) as Device;
        if (errDevice.type !== 'acquired') throw new Error('expected acquired device');
        errDevice.authenticityChecks = {
            ...errDevice.authenticityChecks,
            firmwareRevision: { success: false, error: 'cannot-perform-check-offline' },
        };

        const ok1 = selectFirmwareRevisionCheckErrorIfEnabled(baseState, okDevice);
        const err1 = selectFirmwareRevisionCheckErrorIfEnabled(baseState, errDevice);
        const ok2 = selectFirmwareRevisionCheckErrorIfEnabled(baseState, okDevice);
        const err2 = selectFirmwareRevisionCheckErrorIfEnabled(baseState, errDevice);

        expect(ok1).toBeNull();
        expect(ok2).toBeNull();
        expect(err1).toBe('cannot-perform-check-offline');
        expect(err2).toBe('cannot-perform-check-offline');
    });
});
