import { CreateSuiteSyncOwnerDep } from '@suite-common/suite-sync-storage';

import { SuiteSyncStorageRepositoryDep } from './SuiteSyncStorageRepository';
import { UpdateAccountLabelDep } from './labeling/updateAccountLabel';
import { UpdateAddressLabelDep } from './labeling/updateAddressLabel';
import { UpdateOutputLabelDep } from './labeling/updateOutputLabel';
import { UpdateWalletLabelDep } from './labeling/updateWalletLabel';
import { ChangeRelayUrlDep } from './relay/changeRelayUrl';
import { TurnOffSuiteSyncForWalletDep } from './storage/turnOffSuiteSyncForWallet';
import { TurnOnSuiteSyncForWalletDep } from './storage/turnOnSuiteSyncForWallet';
import { TurnOffSuiteSyncDep } from './turnOffSuiteSync';
import { TurnOnSuiteSyncDep } from './turnOnSuiteSync';

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
