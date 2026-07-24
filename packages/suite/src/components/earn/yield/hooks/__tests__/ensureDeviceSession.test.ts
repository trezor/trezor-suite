import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import TrezorConnect from '@trezor/connect';

import { ensureDeviceSession } from '../ensureDeviceSession';

const device = mockSuiteDevice({
    connected: true,
    available: true,
    state: { staticSessionId: 'wallet@device:0' },
});

describe('ensureDeviceSession', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('returns an error without calling Connect when the session is missing', async () => {
        const getDeviceState = jest.spyOn(TrezorConnect, 'getDeviceState');

        await expect(ensureDeviceSession(undefined)).resolves.toEqual({
            success: false,
            error: 'TR_EARN_YIELD_ERROR_GENERIC',
        });
        expect(getDeviceState).not.toHaveBeenCalled();
    });

    it('confirms the current device session', async () => {
        const getDeviceState = jest
            .spyOn(TrezorConnect, 'getDeviceState')
            .mockResolvedValue({ success: true, payload: { state: {} } });

        await expect(ensureDeviceSession(device)).resolves.toEqual({ success: true });
        expect(getDeviceState).toHaveBeenCalledWith({
            device: expect.objectContaining({
                state: { staticSessionId: 'wallet@device:0' },
            }),
        });
    });

    it('maps a device-state failure to a yield error', async () => {
        jest.spyOn(TrezorConnect, 'getDeviceState').mockResolvedValue({
            success: false,
            error: {
                code: 'Device_InvalidState',
                message: 'Invalid device state',
            },
        });

        await expect(ensureDeviceSession(device)).resolves.toEqual({
            success: false,
            error: 'TR_EARN_YIELD_ERROR_PASSPHRASE_INCORRECT',
        });
    });
});
