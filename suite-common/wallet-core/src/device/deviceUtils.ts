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

// Check if error is an entropy check failure, but not one of the temporarily skipped errors (to be investigated)
export const getIsIgnoredEntropyCheckError = (error: string) => {
    const ignoredErrors = [
        // These errors show up in Sentry and they probably lead to false positives.
        // We should improve the logs to include stack traces so that we can investigate and fix this problem, then remove this condition.
        'unexpected error',
        'A transfer error has occurred',
        // This one was not in Sentry but can be triggered by manually disconnecting the device. Investigate. https://github.com/trezor/trezor-suite-private/issues/135
        'device disconnected during action',
    ];

    return ignoredErrors.includes(error);
};
