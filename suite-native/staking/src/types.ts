import {
    type AccountsRootState,
    type DeviceRootState,
    type StakeRootState,
    type TransactionsRootState,
} from '@suite-common/wallet-core';

export type NativeStakingRootState = AccountsRootState &
    DeviceRootState &
    StakeRootState &
    TransactionsRootState;
