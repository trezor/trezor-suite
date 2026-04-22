import { renderHookWithProviders } from '@suite-native/test-utils';
import { type DeviceThpPairingStatus } from '@trezor/connect';

import { useOnThpPairingCanceled } from '../useOnThpPairingCanceled';

jest.mock('@trezor/connect', () => ({
    ...jest.requireActual('@trezor/connect'),
    on: jest.fn(),
    off: jest.fn(),
}));

const mockDeviceThpPairingStatusChange = (status: DeviceThpPairingStatus) => {
    const TrezorConnect = require('@trezor/connect');
    TrezorConnect.on.mockImplementationOnce(
        (type: 'device-thp_pairing_status_changed', cb: (_: DeviceThpPairingStatus) => void) => {
            if (type === 'device-thp_pairing_status_changed') cb(status);
        },
    );
};

describe('useOnThpPairingCanceled', () => {
    test('callback is triggered', () => {
        mockDeviceThpPairingStatusChange({ status: 'canceled' });
        const callback = jest.fn();

        renderHookWithProviders(() => useOnThpPairingCanceled(callback), { providers: ['intl'] });

        expect(callback).toHaveBeenCalled();
    });

    test('callback is not triggered', () => {
        mockDeviceThpPairingStatusChange({ status: 'finished' });
        const callback = jest.fn();

        renderHookWithProviders(() => useOnThpPairingCanceled(callback), { providers: ['intl'] });

        expect(callback).not.toHaveBeenCalled();
    });
});
