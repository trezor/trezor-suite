import { CreateSuiteSyncOwnerDep } from '@suite-common/suite-sync-storage';

import { SuiteSyncStorageRepositoryDep } from './SuiteSyncStorageRepository';
import { ChangeRelayUrlDep } from './relay/changeRelayUrl';
import { TurnOffSuiteSyncForWalletDep } from './storage/turnOffSuiteSyncForWallet';
import { TurnOnSuiteSyncForWalletDep } from './storage/turnOnSuiteSyncForWallet';
import { TurnOffSuiteSyncDep } from './turnOffSuiteSync';

export type SuiteSync = ChangeRelayUrlDep &
    SuiteSyncStorageRepositoryDep &
    CreateSuiteSyncOwnerDep &
    TurnOffSuiteSyncDep &
    TurnOnSuiteSyncForWalletDep &
    TurnOffSuiteSyncForWalletDep;
