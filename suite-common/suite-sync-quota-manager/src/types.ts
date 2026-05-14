import { type WalletDescriptor } from '@suite-common/wallet-types';

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
