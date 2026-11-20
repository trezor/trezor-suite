import {
    type DeviceRootState,
    isTrezorDeviceWithState,
    selectDeviceId,
    selectDevices,
} from '@suite-common/device';
import { type TrezorDeviceWithState } from '@suite-common/suite-types';
import { type WalletDescriptor, parseStaticSessionId } from '@trezor/device-utils';
import { createWeakMapSelector } from '@trezor/redux-utils';

export type ReferralStandardWallet = {
    device: TrezorDeviceWithState;
    walletDescriptor: WalletDescriptor;
};

const createMemoizedSelector = createWeakMapSelector.withTypes<DeviceRootState>();

/**
 * The referral key is derived from the standard (empty passphrase) wallet, so it is shared by all wallets even across
 * different devices, or after a device wipe. The records are scoped by the standard wallet's descriptor.
 * Connect cannot force to switch a hidden wallet session to standard; the standard session must be already discovered
 * and available, so that we may read & write.
 *
 * Edge case: With `passphrase_always_on_device`, all wallets look like passhprase; Suite cannot find the standard one.
 * This case is intentionally handled the same as if there was surely no standard wallet.
 */
export const selectReferralStandardWallet = (
    state: DeviceRootState,
    deviceId: string | undefined,
): ReferralStandardWallet | null => {
    const device = selectDevices(state).find(
        (instance): instance is TrezorDeviceWithState =>
            instance.id === deviceId &&
            instance.useEmptyPassphrase === true &&
            isTrezorDeviceWithState(instance),
    );

    if (device === undefined) {
        return null;
    }

    return {
        device,
        walletDescriptor: parseStaticSessionId(device.state.staticSessionId).walletDescriptor,
    };
};

export const selectReferAFriendStandardWallet = createMemoizedSelector(
    [
        selectDevices,
        selectDeviceId,
        // TODO: (state: DeviceRootState, deviceId?: string) => deviceId ?? selectDeviceId(state),
    ],
    (devices, deviceId) => {
        const device = devices.find(
            (instance): instance is TrezorDeviceWithState =>
                instance.id === deviceId &&
                instance.useEmptyPassphrase === true &&
                isTrezorDeviceWithState(instance),
        );

        if (device === undefined) {
            return null;
        }

        return {
            device,
            walletDescriptor: parseStaticSessionId(device.state.staticSessionId).walletDescriptor,
        };
    },
);
