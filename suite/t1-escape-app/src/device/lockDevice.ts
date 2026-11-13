import type { DeviceCall } from './deviceSession';

/**
 * Makes the device forget the PIN and the passphrase before the session is given up, so that
 * whoever talks to it next has to unlock it again. `Initialize` first aborts anything still in
 * progress. `LockDevice` has message id 24, which old firmware knows as `ClearSession`.
 */
export const lockDevice = async (call: DeviceCall) => {
    const initialized = await call('Initialize', 'Features');
    if (!initialized.success) return initialized;

    return call('LockDevice', 'Success');
};
