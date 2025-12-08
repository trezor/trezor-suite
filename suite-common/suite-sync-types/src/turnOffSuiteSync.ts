import { Dispatch } from '@reduxjs/toolkit';

import { SuiteSyncOwner } from '@suite-common/suite-types';

import { TurnOffSuiteSyncForWalletDep } from './storage/turnOffSuiteSyncForWallet';

export type TurnOffSuiteSync = () => Promise<void>;

export type TurnOffSuiteSyncDep = { turnOffSuiteSync: TurnOffSuiteSync };

export type CreateTurnOffSuiteSyncDeps = {
    getAllDevicesOwners: () => SuiteSyncOwner[];
    dispatch: Dispatch;
} & TurnOffSuiteSyncForWalletDep;
