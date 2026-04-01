import type { WalletDescriptor } from '@suite-common/wallet-types';

export type GetDeviceHasAllowance = (
    deviceId: string,
    walletDescriptor: WalletDescriptor,
) => boolean;
