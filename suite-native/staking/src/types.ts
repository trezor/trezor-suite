import type { DeviceRootState } from '@suite-common/device';
import {
    type AccountsRootState,
    type StakeRootState,
    type TransactionsRootState,
} from '@suite-common/wallet-core';
import { type CombinedLabelingState } from '@suite-native/labeling';

export type NativeStakingRootState = AccountsRootState &
    DeviceRootState &
    StakeRootState &
    TransactionsRootState &
    CombinedLabelingState;
