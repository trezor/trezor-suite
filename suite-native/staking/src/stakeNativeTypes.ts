import {
    type PushTransactionError,
    type SignTransactionError,
    type SignTransactionTimeoutError,
} from '@suite-common/wallet-core';
import { type StakeType } from '@suite-common/wallet-types';

export type StakeNativeType = Extract<StakeType, 'stake' | 'unstake' | 'claim'>;

// Distinct from SignTransactionError so the UI can tell "can't sign right now" apart from "device disconnected".
export type StakeLiveStateInvalidError = {
    error: 'stake-live-state-invalid';
    message: string;
};

export type SignStakeNativeRejectValue =
    | SignTransactionError
    | SignTransactionTimeoutError
    | PushTransactionError
    | StakeLiveStateInvalidError
    | undefined;
