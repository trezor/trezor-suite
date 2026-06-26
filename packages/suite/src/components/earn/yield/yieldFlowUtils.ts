import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import { YIELD_FLOW_STEPS, type YieldFlowStepId } from '@suite-common/wallet-core';
import { getApyPercent } from '@suite-common/wallet-utils';
import type { StepListItemState } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

export { getYieldApprovalAction, type YieldApprovalAction } from '@suite-common/wallet-core';

interface AmountComparisonParams {
    amount?: string;
    threshold?: string;
}

interface YieldModifyAmountInputParams {
    liveAmount?: string;
    actionAmount?: string | null;
    maxAmount: string;
}

export const isAmountGreaterThan = ({ amount, threshold }: AmountComparisonParams): boolean =>
    !!amount && !!threshold && new BigNumber(amount).gt(threshold);

export const getYieldModifyAmountInput = ({
    liveAmount,
    actionAmount,
    maxAmount,
}: YieldModifyAmountInputParams) => {
    const nextAmount = liveAmount || actionAmount || '';

    return isAmountGreaterThan({ amount: nextAmount, threshold: maxAmount })
        ? maxAmount
        : nextAmount;
};

/**
 * Encodes per-component APY contributions as a single comma-separated string:
 * `SYMBOL_A,APY_A,SYMBOL_B,APY_B,…` sorted alphabetically by symbol. Each
 * component is emitted as-is — symbols repeating across components are not
 * merged. Returns an empty string when there are no usable components.
 */
export const getApyBreakdown = (
    components: YieldDtoV2['rewardRate']['components'] | undefined,
): string =>
    (components ?? [])
        .map(component => {
            if (!Number.isFinite(component.rate)) return null;
            const symbol = component.token?.symbol;
            if (!symbol) return null;
            const componentApy = getApyPercent(component.rate);

            return componentApy != null ? ([symbol, componentApy] as const) : null;
        })
        .filter((pair): pair is readonly [string, number] => pair !== null)
        .sort(([a], [b]) => a.localeCompare(b))
        .flatMap(([symbol, componentApy]) => [symbol, String(componentApy)])
        .join(',');

export const getStepListItemStates = (
    currentStep: YieldFlowStepId,
): Record<YieldFlowStepId, StepListItemState> => {
    const currentStepIndex = YIELD_FLOW_STEPS.indexOf(currentStep);

    const getStepState = (stepId: YieldFlowStepId): StepListItemState => {
        const stepIndex = YIELD_FLOW_STEPS.indexOf(stepId);

        if (stepIndex < currentStepIndex) {
            return 'done';
        }

        if (stepIndex === currentStepIndex) {
            return 'active';
        }

        return 'pending';
    };

    const stepStates = {
        approve: getStepState('approve'),
        action: getStepState('action'),
        complete: getStepState('complete'),
    } satisfies Record<YieldFlowStepId, StepListItemState>;

    return stepStates;
};
