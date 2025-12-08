import { Dispatch } from '@reduxjs/toolkit';

import { SuiteSyncOwner } from '@suite-common/suite-types';

import { SuiteSyncStorageRepositoryDep } from '../SuiteSyncStorageRepository';

export type ChangeRelayUrlDeps = {
    getAllDevicesOwners: () => SuiteSyncOwner[];
    dispatch: Dispatch;
} & SuiteSyncStorageRepositoryDep;

export type ChangeRelayUrl = (params: { relayUrl: string | null }) => Promise<void>;

export type ChangeRelayUrlDep = {
    changeRelayUrl: ChangeRelayUrl;
};
