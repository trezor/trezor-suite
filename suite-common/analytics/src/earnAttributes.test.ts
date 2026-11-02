import { mockSuiteDevice } from '@suite-common/suite-types/mocks';

import { getEarnDeviceStatus } from './earnAttributes';

const connectedDevice = mockSuiteDevice({ connected: true, available: true });

describe('getEarnDeviceStatus', () => {
    it('reports no selected device as disconnected', () => {
        expect(getEarnDeviceStatus(undefined)).toBe('disconnected');
    });

    it('gives disconnection priority over stale authorization requests', () => {
        expect(
            getEarnDeviceStatus(
                { ...connectedDevice, connected: false },
                { isPinRequested: true, isPassphraseRequested: true },
            ),
        ).toBe('disconnected');
    });

    it('reports an ordinary connected device', () => {
        expect(getEarnDeviceStatus(connectedDevice)).toBe('connected');
    });

    it('does not treat passphrase protection as a pending passphrase request', () => {
        expect(
            getEarnDeviceStatus(
                mockSuiteDevice(
                    { connected: true, available: true },
                    {
                        passphrase_protection: true,
                        unlocked: true,
                    },
                ),
            ),
        ).toBe('connected');
    });

    it('reports a PIN-locked device before a prompt is opened', () => {
        expect(
            getEarnDeviceStatus(
                mockSuiteDevice({ connected: true, available: true, status: 'pin-locked' }),
            ),
        ).toBe('pin');
        expect(
            getEarnDeviceStatus(
                mockSuiteDevice(
                    { connected: true, available: true },
                    {
                        pin_protection: true,
                        unlocked: false,
                    },
                ),
            ),
        ).toBe('pin');
    });

    it('does not infer a PIN request from missing unlocked features', () => {
        expect(
            getEarnDeviceStatus(
                mockSuiteDevice(
                    { connected: true, available: true },
                    {
                        pin_protection: true,
                        unlocked: undefined,
                    },
                ),
            ),
        ).toBe('connected');
    });

    it('gives a PIN request priority over passphrase and availability', () => {
        expect(
            getEarnDeviceStatus(
                { ...connectedDevice, available: false },
                { isPinRequested: true, isPassphraseRequested: true },
            ),
        ).toBe('pin');
    });

    it('reports an active passphrase request', () => {
        expect(getEarnDeviceStatus(connectedDevice, { isPassphraseRequested: true })).toBe(
            'passphrase',
        );
    });

    it.each([
        'busy',
        'occupied',
        'thp-locked',
        'rebooting',
        'hard-locked',
        'bootloader-locked',
    ] as const)('reports a connected but unusable device (%s)', status => {
        expect(
            getEarnDeviceStatus(mockSuiteDevice({ connected: true, available: true, status })),
        ).toBe('unavailable');
    });

    it('reports a connected but unavailable wallet', () => {
        expect(getEarnDeviceStatus({ ...connectedDevice, available: false })).toBe('unavailable');
    });
});
