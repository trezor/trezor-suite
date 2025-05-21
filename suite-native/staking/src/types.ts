import { DeviceRootState } from '@suite-common/device';
import { AccountsRootState, TransactionsRootState } from '@suite-common/wallet-core';
import { StakeRootState } from '@suite-common/wallet-stake';

export type NativeStakingRootState = AccountsRootState &
    DeviceRootState &
    StakeRootState &
    TransactionsRootState;
