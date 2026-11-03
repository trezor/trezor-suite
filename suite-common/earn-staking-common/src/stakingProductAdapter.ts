import type { StakingAccount } from './stakingAccount';
import type { StakingAmount } from './stakingAmount';
import type { StakingCustomFee, StakingFeeLevelLabel } from './stakingFeeLevels';
import type { StakingOperation, StakingOperationOptions } from './stakingOperation';
import type {
    ComposedStakingStep,
    SignedStakingStep,
    StakingPlan,
    StakingStep,
} from './stakingPlan';
import type { StakingPosition } from './stakingPosition';
import type { StakingProductDescriptor } from './stakingProductDescriptor';
import type { StakingProductInfo } from './stakingProductInfo';

export type FetchProductInfoParams = {
    abortSignal?: AbortSignal;
};

export type GetPositionParams = {
    account: StakingAccount;
    productInfo: StakingProductInfo | null;
};

export type StakingAmountBounds = {
    min: StakingAmount;
    max: StakingAmount;
};

export type GetAmountBoundsParams = {
    account: StakingAccount;
    position: StakingPosition | null;
    operation: StakingOperation;
    options: StakingOperationOptions;
};

export type PlanOperationParams = GetAmountBoundsParams & {
    amount: StakingAmount | null;
};

export type StakingStepParams = {
    account: StakingAccount;
    plan: StakingPlan;
    step: StakingStep;
};

export type ComposeStepParams = StakingStepParams & {
    customFee: StakingCustomFee | null;
};

export type SignStepParams = StakingStepParams & {
    composedStep: ComposedStakingStep;
    feeLevel: StakingFeeLevelLabel;
};

export type BroadcastStepParams = StakingStepParams & {
    signedStep: SignedStakingStep;
};

/** @serviceContract */
export type StakingProductAdapter = {
    descriptor: StakingProductDescriptor;
    fetchProductInfo: (params: FetchProductInfoParams) => Promise<StakingProductInfo>;
    getPosition: (params: GetPositionParams) => StakingPosition | null;
    getAmountBounds: (params: GetAmountBoundsParams) => StakingAmountBounds;
    planOperation: (params: PlanOperationParams) => Promise<StakingPlan>;
    composeStep: (params: ComposeStepParams) => Promise<ComposedStakingStep>;
    signStep: (params: SignStepParams) => Promise<SignedStakingStep>;
    broadcastStep: (params: BroadcastStepParams) => Promise<{ txid: string }>;
};
