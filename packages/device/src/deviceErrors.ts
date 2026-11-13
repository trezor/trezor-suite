/**
 * This whole file is intended as a helper for wrapping connect errors to abstract them for use
 * in the Suite.
 *
 * It would be great if Connect incorporates some of this abstraction so we can get rid of this.
 */

/**
 * Error when user cancels the operation on the Device.
 */
export type DeviceCancelledErrType = { type: 'DeviceCancelled' };

/**
 * This is (generic) delegated error from the Device (from Firmware/Connect).
 */
export type DeviceErrorType = {
    type: 'DeviceError';
    message: string;
    /** The Connect error code, where the caller keeps it (for analytics, for example). */
    code?: string;
};

export type DeviceNotConnectedErrorType = { type: 'DeviceNotConnectedError'; message: string };

export const DeviceCancelledErr = (): DeviceCancelledErrType => ({
    type: 'DeviceCancelled' as const,
});

export const isCanceledErrorMessage = (errorMessage: string | null | undefined) =>
    Boolean(errorMessage?.toLocaleLowerCase().includes('cancelled'));

export const DeviceError = (message: string): DeviceErrorType => ({
    type: 'DeviceError' as const,
    message,
});

export const DeviceNotConnectedError = (
    message: string | null = null,
): DeviceNotConnectedErrorType => ({
    type: 'DeviceNotConnectedError' as const,
    message: message ?? 'Device is not connected',
});
