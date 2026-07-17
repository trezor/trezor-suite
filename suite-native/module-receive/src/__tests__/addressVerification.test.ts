import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';

import { AddressVerificationResultType, verifyReceiveAddress } from '../addressVerification';

jest.mock('@suite-native/device-mutex', () => ({
    requestPrioritizedDeviceAccess: jest.fn(),
}));

const mockRequestPrioritizedDeviceAccess = jest.mocked(requestPrioritizedDeviceAccess);
const confirmAddressOnDevice = jest.fn();

describe('verifyReceiveAddress', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns a device access error', async () => {
        mockRequestPrioritizedDeviceAccess.mockResolvedValue({
            success: false,
            error: 'Device access failed',
        });

        await expect(verifyReceiveAddress(confirmAddressOnDevice)).resolves.toEqual({
            type: AddressVerificationResultType.DeviceAccessError,
            error: 'Device access failed',
        });
    });

    it('returns success when the address was verified', async () => {
        mockRequestPrioritizedDeviceAccess.mockResolvedValue({
            success: true,
            payload: {
                success: true,
                payload: { address: 'bc1qreceiveaddress', path: [], serializedPath: 'm' },
            },
        });

        await expect(verifyReceiveAddress(confirmAddressOnDevice)).resolves.toEqual({
            type: AddressVerificationResultType.Success,
        });
        expect(mockRequestPrioritizedDeviceAccess).toHaveBeenCalledWith(confirmAddressOnDevice);
    });

    it('returns an action cancellation', async () => {
        const error = {
            code: 'Failure_ActionCancelled',
            message: 'Action cancelled',
        };
        mockRequestPrioritizedDeviceAccess.mockResolvedValue({
            success: true,
            payload: { success: false, error },
        });

        await expect(verifyReceiveAddress(confirmAddressOnDevice)).resolves.toEqual({
            type: AddressVerificationResultType.ActionCancelled,
            error,
        });
    });

    it('returns an incorrect passphrase error', async () => {
        const error = {
            message: 'Passphrase is incorrect',
        };
        mockRequestPrioritizedDeviceAccess.mockResolvedValue({
            success: true,
            payload: { success: false, error },
        });

        await expect(verifyReceiveAddress(confirmAddressOnDevice)).resolves.toEqual({
            type: AddressVerificationResultType.PassphraseIncorrect,
            error,
        });
    });

    it.each(['Method_Interrupted', 'Failure_PinInvalid', 'Method_Cancel', 'Failure_PinCancelled'])(
        'returns a silent error for %s',
        async errorCode => {
            const error = {
                code: errorCode,
                message: 'Verification failed',
            };
            mockRequestPrioritizedDeviceAccess.mockResolvedValue({
                success: true,
                payload: { success: false, error },
            });

            await expect(verifyReceiveAddress(confirmAddressOnDevice)).resolves.toEqual({
                type: AddressVerificationResultType.Silent,
                error,
            });
        },
    );

    it.each([undefined, 'Failure_UnknownCode'])(
        'returns an unexpected error for %s',
        async errorCode => {
            const error = {
                code: errorCode,
                message: 'Verification failed',
            };
            mockRequestPrioritizedDeviceAccess.mockResolvedValue({
                success: true,
                payload: { success: false, error },
            });

            await expect(verifyReceiveAddress(confirmAddressOnDevice)).resolves.toEqual({
                type: AddressVerificationResultType.Unexpected,
                error,
            });
        },
    );
});
