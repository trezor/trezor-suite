import { type NetworkSymbol, type StakingProviderId } from '@suite-common/wallet-config';
import { type Account, type BaseStakeType, type StakingLimits } from '@suite-common/wallet-types';
import { type VerifyIssue } from '@trezor/network-ethereum-suite-common';

import { type StakingPosition } from '../../positions/positionsTypes';
import {
    type EthereumStakingLiveStateReason,
    type EthereumStakingLiveStateValidation,
    type ReadEthereumStakingPools,
} from '../ethereumStakingLiveState';

export type EthereumStakingAccount = Account & { networkType: 'ethereum' };

export type StakingOperationRequest =
    { type: 'stake'; amount: string } | { type: 'unstake'; amount: string } | { type: 'claim' };

export type StakingTxStep = {
    label: BaseStakeType;
    to: string;
    data: string;
    value: string;
    gasReserve: number;
};

export type StakingTxPlan = {
    providerId: StakingProviderId;
    operation: StakingOperationRequest;
    steps: StakingTxStep[];
};

export type StakingPlanContext = {
    account: Account;
    source: string;
    readStakingPools: ReadEthereumStakingPools;
};

export type StakingLiveStateContext = {
    account: Account;
    readStakingPools: ReadEthereumStakingPools;
};

export type StakingStepContext = {
    symbol: NetworkSymbol;
    source: string;
};

export type StakingPlanError =
    | { code: 'UNSUPPORTED_NETWORK' }
    | { code: 'AMOUNT_BELOW_MINIMUM'; minAmount: string }
    | { code: 'LIVE_STATE_INVALID'; reason: EthereumStakingLiveStateReason };

export type StakingPlanResult =
    { success: true; plan: StakingTxPlan } | { success: false; error: StakingPlanError };

export type StakingStepCalldata = Pick<StakingTxStep, 'label' | 'data'>;

export type StakingCalldataVerification = { isValid: boolean; issues: VerifyIssue[] };

export type StakingUnstakePreviewParams = {
    amount: string;
    from: string;
    symbol: NetworkSymbol;
    source?: string;
};

export type EthereumStakingProviderAdapter = {
    readonly id: StakingProviderId;
    readonly limits: StakingLimits;
    readonly contributesToNativeBalance: boolean;
    /** Sync part of the position from account data alone; null when the account holds nothing with this provider. */
    derivePosition: (account: Account) => StakingPosition | null;
    /** Encodes the step of an operation without any chain read; null on a network without a deployment. */
    buildStep: (
        request: StakingOperationRequest,
        context: StakingStepContext,
    ) => StakingTxStep | null;
    planOperation: (
        request: StakingOperationRequest,
        context: StakingPlanContext,
    ) => Promise<StakingPlanResult>;
    verifyStep: (step: StakingStepCalldata, source: string) => StakingCalldataVerification;
    validateLiveState: (
        step: StakingStepCalldata,
        context: StakingLiveStateContext,
    ) => Promise<EthereumStakingLiveStateValidation>;
    previewUnstake?: (params: StakingUnstakePreviewParams) => Promise<string | null>;
};
