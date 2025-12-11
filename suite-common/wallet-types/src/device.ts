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
export type DeviceErrorType = { type: 'DeviceError'; message: string };
