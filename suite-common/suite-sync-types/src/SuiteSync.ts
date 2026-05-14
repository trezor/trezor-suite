import { type DangerouslyWipeAllLabelsFromWalletDep } from './data/dangerouslyWipeAllLabelsFromWallet';
import { type UpdateAccountLabelDep } from './data/updateAccountLabel';
import { type UpdateAddressLabelDep } from './data/updateAddressLabel';
import { type UpdateOutputLabelDep } from './data/updateOutputLabel';
import { type UpdateWalletLabelDep } from './data/updateWalletLabel';
import { type ChangeRelayUrlDep } from './relay/changeRelayUrl';
import { type EnsureWalletSuiteSyncOnDep } from './storage/ensureWalletSuiteSyncOn';
import { type TurnOffSuiteSyncForWalletDep } from './storage/turnOffSuiteSyncForWallet';
import { type TurnOffSuiteSyncDep } from './turnOffSuiteSync';
import { type TurnOnSuiteSyncDep } from './turnOnSuiteSync';

export type SuiteSync = ChangeRelayUrlDep &
    TurnOnSuiteSyncDep &
    TurnOffSuiteSyncDep &
    EnsureWalletSuiteSyncOnDep &
    DangerouslyWipeAllLabelsFromWalletDep &
    TurnOffSuiteSyncForWalletDep & {
        labeling: UpdateWalletLabelDep &
            UpdateAccountLabelDep &
            UpdateAddressLabelDep &
            UpdateOutputLabelDep;
    };

export type SuiteSyncDep = { suiteSync: SuiteSync };
