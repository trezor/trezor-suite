import { UpdateAccountLabelDep } from './data/updateAccountLabel';
import { UpdateAddressLabelDep } from './data/updateAddressLabel';
import { UpdateOutputLabelDep } from './data/updateOutputLabel';
import { UpdateWalletLabelDep } from './data/updateWalletLabel';
import { ChangeRelayUrlDep } from './relay/changeRelayUrl';
import { EnsureWalletSuiteSyncOnDep } from './storage/ensureWalletSuiteSyncOn';
import { TurnOffSuiteSyncForWalletDep } from './storage/turnOffSuiteSyncForWallet';
import { TurnOffSuiteSyncDep } from './turnOffSuiteSync';
import { TurnOnSuiteSyncDep } from './turnOnSuiteSync';

export type SuiteSync = ChangeRelayUrlDep &
    TurnOnSuiteSyncDep &
    TurnOffSuiteSyncDep &
    EnsureWalletSuiteSyncOnDep &
    TurnOffSuiteSyncForWalletDep & {
        labeling: UpdateWalletLabelDep &
            UpdateAccountLabelDep &
            UpdateAddressLabelDep &
            UpdateOutputLabelDep;
    };

export type SuiteSyncDep = { suiteSync: SuiteSync };
