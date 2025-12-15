import type { CreateSuiteSyncOwnerDep } from '@suite-common/suite-sync-storage';

import type { SuiteSyncStorageRepositoryDep } from './SuiteSyncStorageRepository';
import type { UpdateAccountLabelDep } from './labeling/updateAccountLabel';
import type { UpdateAddressLabelDep } from './labeling/updateAddressLabel';
import type { UpdateOutputLabelDep } from './labeling/updateOutputLabel';
import type { UpdateWalletLabelDep } from './labeling/updateWalletLabel';
import type { ChangeRelayUrlDep } from './relay/changeRelayUrl';
import type { TurnOffSuiteSyncForWalletDep } from './storage/turnOffSuiteSyncForWallet';
import type { TurnOnSuiteSyncForWalletDep } from './storage/turnOnSuiteSyncForWallet';
import type { TurnOffSuiteSyncDep } from './turnOffSuiteSync';
import type { TurnOnSuiteSyncDep } from './turnOnSuiteSync';

export type SuiteSync = ChangeRelayUrlDep &
    SuiteSyncStorageRepositoryDep &
    CreateSuiteSyncOwnerDep &
    TurnOnSuiteSyncDep &
    TurnOffSuiteSyncDep &
    TurnOnSuiteSyncForWalletDep &
    TurnOffSuiteSyncForWalletDep & {
        labeling: UpdateWalletLabelDep &
            UpdateAccountLabelDep &
            UpdateAddressLabelDep &
            UpdateOutputLabelDep;
    };
