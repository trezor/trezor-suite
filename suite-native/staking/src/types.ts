import {
    AccountsRootState,
    DeviceRootState,
    StakeRootState,
    TransactionsRootState,
} from '@suite-common/wallet-core';

export type NativeStakingRootState = AccountsRootState &
    DeviceRootState &
    StakeRootState &
    TransactionsRootState;
