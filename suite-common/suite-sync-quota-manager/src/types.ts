import { type WalletDescriptor } from '@suite-common/wallet';

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
