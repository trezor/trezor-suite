import {
    type PushTransactionError,
    type SignTransactionError,
    type SignTransactionTimeoutError,
} from '@suite-common/wallet-core';
import { type StakeType } from '@suite-common/wallet-types';

export type StakeNativeType = Extract<StakeType, 'stake' | 'unstake' | 'claim'>;

export type SignStakeNativeRejectValue =
    | SignTransactionError
    | SignTransactionTimeoutError
    | PushTransactionError
    | undefined;
