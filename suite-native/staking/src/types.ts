import { DeviceRootState } from '@suite-common/device';
import { AccountsRootState } from '@suite-common/wallet-blockchain';
import { StakeRootState } from '@suite-common/wallet-stake';
import { TransactionsRootState } from '@suite-common/wallet-transactions';

export type NativeStakingRootState = AccountsRootState &
    DeviceRootState &
    StakeRootState &
    TransactionsRootState;
