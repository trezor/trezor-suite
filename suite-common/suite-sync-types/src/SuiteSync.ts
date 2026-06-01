import { type DangerouslyWipeAllLabelsFromWalletDep } from './data/dangerouslyWipeAllLabelsFromWallet';
import { type UpdateAccountLabelDep } from './data/updateAccountLabel';
import { type UpdateAddressLabelDep } from './data/updateAddressLabel';
import { type UpdateOutputLabelDep } from './data/updateOutputLabel';
import { type UpdateWalletLabelDep } from './data/updateWalletLabel';
import { type ChangeRelayUrlDep } from './relay/changeRelayUrl';
import {
    type EnsureWalletSuiteSyncOnAsyncDep,
    type EnsureWalletSuiteSyncOnDep,
    type OnWalletSuiteSyncOnEnsuredDep,
} from './storage/ensureWalletSuiteSyncOn';
import { type TurnOffSuiteSyncForWalletDep } from './storage/turnOffSuiteSyncForWallet';
import { type TurnOffSuiteSyncDep } from './turnOffSuiteSync';
import { type TurnOnSuiteSyncDep } from './turnOnSuiteSync';

export type LabelingDep = {
    labeling: UpdateWalletLabelDep &
        UpdateAccountLabelDep &
        UpdateAddressLabelDep &
        UpdateOutputLabelDep;
};

export type SuiteSync = ChangeRelayUrlDep &
    TurnOnSuiteSyncDep &
    TurnOffSuiteSyncDep &
    EnsureWalletSuiteSyncOnDep &
    EnsureWalletSuiteSyncOnAsyncDep &
    OnWalletSuiteSyncOnEnsuredDep &
    DangerouslyWipeAllLabelsFromWalletDep &
    TurnOffSuiteSyncForWalletDep &
    LabelingDep;

export type SuiteSyncDep = { suiteSync: SuiteSync };

export const selectSuiteSyncDep = (services: any): SuiteSyncDep => ({
    suiteSync: services.suiteSync,
});
