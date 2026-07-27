import { type WalletDescriptor } from '@trezor/device-utils';

export type RegisteredDevice = {
    deviceId: string;
    totalStorageSize: number;
    unspentStorageSize: number;
    dismissedNoQuotaLeftWarning: boolean;
};

export type OwnerAllowance = {
    walletDescriptor: WalletDescriptor;
    totalSpace: number;
};
