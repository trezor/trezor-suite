import {
    AccountsRootState,
    DeviceRootState,
    StakeRootState,
    TransactionsRootState,
} from '@suite-common/wallet-core';
import { CombinedLabelingState } from '@suite-native/labeling';

export type NativeStakingRootState = AccountsRootState &
    DeviceRootState &
    StakeRootState &
    TransactionsRootState &
    CombinedLabelingState;
