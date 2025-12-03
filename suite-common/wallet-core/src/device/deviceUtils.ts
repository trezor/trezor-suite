/**
 * Error when user cancels the operation on the Device.
 */
export type DeviceCancelledErr = { type: 'DeviceCancelled' };

export const DeviceCancelledErr = (): DeviceCancelledErr => ({ type: 'DeviceCancelled' as const });

export const isCanceledErrorMessage = (errorMessage: string | null | undefined) =>
    Boolean(errorMessage?.toLocaleLowerCase().includes('cancelled'));

/**
 * This is (generic) delegated error from the Device (from Firmware/Connect).
 */
export type DeviceError = { type: 'DeviceError'; message: string };

export const DeviceError = (message: string): DeviceError => ({
    type: 'DeviceError' as const,
    message,
});
