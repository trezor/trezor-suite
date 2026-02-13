import { WalletDescriptor } from '@suite-common/wallet-types';

export type RegisteredDevice = {
    deviceId: string;
    totalStorageSize: number;
    unspentStorageSize: number;
};

export type OwnerAllowance = {
    walletDescriptor: WalletDescriptor;
    totalSpace: number;
};
