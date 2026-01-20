import { WalletDescriptor } from '@suite-common/wallet-types';
import { Branded } from '@trezor/type-utils';

export type SuiteSyncOwnerIdHashed = string & Branded<'SuiteSyncOwnerIdHashed'>;

export const asSuiteSyncOwnerIdHashed = (value: string): SuiteSyncOwnerIdHashed =>
    value as SuiteSyncOwnerIdHashed;

export type RegisteredDevice = {
    deviceId: string;
    totalStorageSize: number;
    unspentStorageSize: number;
};

export type OwnerAllowance = {
    walletDescriptor: WalletDescriptor;
    totalSpace: number;
};
