import { type DeviceRootState, isTrezorDeviceWithState, selectDevices } from '@suite-common/device';
import { type TrezorDeviceWithState } from '@suite-common/suite-types';

/**
 * The referral key is derived from the standard (no passphrase) wallet, so it is the same for all
 * wallets of the seed. Connect does not switch a hidden wallet's session to the standard wallet,
 * so the derivation must run on a standard wallet instance known to Suite, never on a hidden one.
 */
export const selectReferralKeyDerivationDevice = (
    state: DeviceRootState,
    deviceId: string | undefined,
): TrezorDeviceWithState | null =>
    selectDevices(state).find(
        (device): device is TrezorDeviceWithState =>
            device.id === deviceId &&
            device.useEmptyPassphrase === true &&
            isTrezorDeviceWithState(device),
    ) ?? null;
