import { type DangerouslyWipeAllLabelsFromWalletDep } from './data/dangerouslyWipeAllLabelsFromWallet';
import { type UpdateAccountLabelDep, type WriteAccountLabelDep } from './data/updateAccountLabel';
import { type UpdateAddressLabelDep, type WriteAddressLabelDep } from './data/updateAddressLabel';
import { type UpdateOutputLabelDep, type WriteOutputLabelDep } from './data/updateOutputLabel';
import { type UpdateWalletLabelDep, type WriteWalletLabelDep } from './data/updateWalletLabel';
import { type ChangeRelayUrlDep } from './relay/changeRelayUrl';
import { type DisconnectAllRelaysDep } from './relay/disconnectAllRelays';
import { type ReconnectAllRelaysDep } from './relay/reconnectAllRelays';
import {
    type EnsureWalletSuiteSyncOnDep,
    type EnsureWalletSuiteSyncOnUncontrolledDep,
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

export type WriteLabelsDep = WriteWalletLabelDep &
    WriteAccountLabelDep &
    WriteAddressLabelDep &
    WriteOutputLabelDep;

export type SuiteSync = ChangeRelayUrlDep &
    DisconnectAllRelaysDep &
    ReconnectAllRelaysDep &
    TurnOnSuiteSyncDep &
    TurnOffSuiteSyncDep &
    EnsureWalletSuiteSyncOnDep &
    EnsureWalletSuiteSyncOnUncontrolledDep &
    DangerouslyWipeAllLabelsFromWalletDep &
    TurnOffSuiteSyncForWalletDep &
    LabelingDep;

export type SuiteSyncDep = { suiteSync: SuiteSync };
