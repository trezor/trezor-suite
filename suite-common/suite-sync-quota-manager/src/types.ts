import { Branded } from '@trezor/type-utils';

export type SuiteSyncOwnerIdHashed = string & Branded<'SuiteSyncOwnerIdHashed'>;

export const asSuiteSyncOwnerIdHashed = (value: string): SuiteSyncOwnerIdHashed =>
    value as SuiteSyncOwnerIdHashed;

export type RegisteredDevice = {
    deviceId: string;
    publicKey: string;
    totalStorageSize: number;
    unspentStorageSize: number;
};

export type AssignedOwnerId = {
    ownerIdHash: SuiteSyncOwnerIdHashed;
    totalSpace: number;
};
