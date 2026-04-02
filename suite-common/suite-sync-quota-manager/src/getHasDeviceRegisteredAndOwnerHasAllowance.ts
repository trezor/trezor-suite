import type { WalletDescriptor } from '@suite-common/wallet-types';

export type GetHasDeviceRegisteredAndOwnerHasAllowance = (
    deviceId: string,
    walletDescriptor: WalletDescriptor,
) => boolean;

export type GetHasDeviceRegisteredAndOwnerHasAllowanceDep = {
    getHasDeviceRegisteredAndOwnerHasAllowance: GetHasDeviceRegisteredAndOwnerHasAllowance;
};
