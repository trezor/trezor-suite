import type { WalletDescriptor } from '@trezor/device-utils';

export type GetHasDeviceRegisteredAndOwnerHasAllowance = (
    deviceId: string,
    walletDescriptor: WalletDescriptor,
) => boolean;

export type GetHasDeviceRegisteredAndOwnerHasAllowanceDep = {
    getHasDeviceRegisteredAndOwnerHasAllowance: GetHasDeviceRegisteredAndOwnerHasAllowance;
};
