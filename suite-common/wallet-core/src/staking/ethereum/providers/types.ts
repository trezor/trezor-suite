import { type NetworkSymbol, type StakingProviderId } from '@suite-common/wallet-config';
import { type Account, type BaseStakeType, type StakingLimits } from '@suite-common/wallet-types';
import { type VerifyIssue } from '@trezor/network-ethereum-suite-common';

import {
    type EthereumStakingLiveStateReason,
    type EthereumStakingLiveStateValidation,
    type ReadEthereumStakingPool,
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
    readStakingPool: ReadEthereumStakingPool;
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
    planOperation: (
        request: StakingOperationRequest,
        context: StakingPlanContext,
    ) => Promise<StakingPlanResult>;
    verifyStep: (step: StakingStepCalldata, source: string) => StakingCalldataVerification;
    validateLiveState: (
        step: StakingStepCalldata,
        readStakingPool: ReadEthereumStakingPool,
    ) => Promise<EthereumStakingLiveStateValidation>;
    previewUnstake?: (params: StakingUnstakePreviewParams) => Promise<string | null>;
};
