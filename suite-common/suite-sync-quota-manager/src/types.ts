import type { SuiteSyncOwnerId } from '@suite-common/suite-types';

export type RegisteredDevice = {
    deviceId: string;
    publicKey: string;
    totalStorageSize: number;
    unspentStorageSize: number;
};

export type AssignedOwnerId = {
    ownerId: SuiteSyncOwnerId;
    totalSpace: number;
};
