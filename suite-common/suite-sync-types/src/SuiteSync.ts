import { UpdateAccountLabelDep } from './data/updateAccountLabel';
import { UpdateAddressLabelDep } from './data/updateAddressLabel';
import { UpdateOutputLabelDep } from './data/updateOutputLabel';
import { UpdateWalletLabelDep } from './data/updateWalletLabel';
import { ChangeRelayUrlDep } from './relay/changeRelayUrl';
import { TurnOffSuiteSyncForWalletDep } from './storage/turnOffSuiteSyncForWallet';
import { TurnOnSuiteSyncForWalletDep } from './storage/turnOnSuiteSyncForWallet';
import { TurnOffSuiteSyncDep } from './turnOffSuiteSync';
import { TurnOnSuiteSyncDep } from './turnOnSuiteSync';

export type SuiteSync = ChangeRelayUrlDep &
    TurnOnSuiteSyncDep &
    TurnOffSuiteSyncDep &
    TurnOnSuiteSyncForWalletDep &
    TurnOffSuiteSyncForWalletDep & {
        labeling: UpdateWalletLabelDep &
            UpdateAccountLabelDep &
            UpdateAddressLabelDep &
            UpdateOutputLabelDep;
    };
