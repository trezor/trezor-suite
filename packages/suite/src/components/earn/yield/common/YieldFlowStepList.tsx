import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import {
    YIELD_FLOW_STEP_SEQUENCES,
    type YieldFlowStepId,
    type YieldFlowType,
} from '@suite-common/wallet-core';
import { Column, Row, StepList, Text } from '@trezor/components';

import { type YieldFlowStepView, getYieldFlowSteps } from '../yieldFlowUtils';

/** Steps of a given flow derived from its sequence — a new step in the sequence must be defined. */
export type YieldFlowStepOf<TFlowType extends YieldFlowType> =
    (typeof YIELD_FLOW_STEP_SEQUENCES)[TFlowType][number];

export type YieldFlowStepDefinition = {
    /** Label on the title row next to the step number. */
    title?: ReactNode;
    /** Right side of the title row (e.g. a modify action); receives the view for state-dependent actions. */
    rightContent?: (view: YieldFlowStepView) => ReactNode;
    /**
     * Renders the step as a StepList item and counts it into the step numbering. A non-list
     * step takes over the whole area while active (e.g. a final complete screen). Default true.
     */
    isListItem?: boolean;
    /** Shown while the step is active. */
    content: (view: YieldFlowStepView) => ReactNode;
    /** Shown in the remaining step states; without it an inactive step has no content. */
    inactiveContent?: (view: YieldFlowStepView) => ReactNode;
};

type YieldFlowStepListProps<TFlowType extends YieldFlowType> = {
    flowType: TFlowType;
    currentStep: YieldFlowStepId;
    steps: Record<YieldFlowStepOf<TFlowType>, YieldFlowStepDefinition>;
    /** Renders the steps as an ordered StepList; without it only the current step's content shows. */
    hasStepList?: boolean;
};

export const YieldFlowStepList = <TFlowType extends YieldFlowType>({
    flowType,
    currentStep,
    steps,
    hasStepList = false,
}: YieldFlowStepListProps<TFlowType>) => {
    // Widened — the prop is keyed by the flow's own steps, but we index it with generic step ids.
    const stepDefinitions: Partial<Record<YieldFlowStepId, YieldFlowStepDefinition>> = steps;
    const sequence: readonly YieldFlowStepId[] = YIELD_FLOW_STEP_SEQUENCES[flowType];
    const listSteps = sequence.filter(stepId => stepDefinitions[stepId]?.isListItem !== false);
    const views = getYieldFlowSteps(flowType, currentStep, listSteps);

    const renderStepContent = (stepId: YieldFlowStepId) => {
        const definition = stepDefinitions[stepId];

        if (!definition) {
            return null;
        }

        const view = views[stepId];

        if (view.state === 'active') {
            return definition.content(view);
        }

        return definition.inactiveContent?.(view) ?? null;
    };

    const isCurrentStepListItem = stepDefinitions[currentStep]?.isListItem !== false;

    if (!isCurrentStepListItem || !hasStepList) {
        return <>{renderStepContent(currentStep)}</>;
    }

    return (
        <StepList isOrdered bulletSize="large" bulletGap={12} gap={24} titleGap={16}>
            {listSteps.map(stepId => {
                const view = views[stepId];
                const definition = stepDefinitions[stepId];

                return (
                    <StepList.Item
                        key={stepId}
                        state={view.state}
                        title={
                            <Column gap={8} width="100%">
                                <Text
                                    typographyStyle="body-xs"
                                    intent="neutral"
                                    priority="secondary"
                                    case="uppercase"
                                >
                                    <Translation id="TR_STEP_OF_TOTAL" values={view.indicator} />
                                </Text>

                                <Row
                                    justifyContent="space-between"
                                    alignItems="center"
                                    width="100%"
                                    gap={16}
                                >
                                    {definition?.title}
                                    {definition?.rightContent?.(view)}
                                </Row>
                            </Column>
                        }
                    >
                        {renderStepContent(stepId)}
                    </StepList.Item>
                );
            })}
        </StepList>
    );
};
