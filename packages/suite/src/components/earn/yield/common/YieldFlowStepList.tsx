import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { type YieldFlowStepId } from '@suite-common/wallet-core';
import { Column, Row, StepList, Text } from '@trezor/components';

import { type YieldFlowStepView, getYieldFlowSteps } from '../yieldFlowUtils';

export type YieldFlowStepDefinition = {
    /** Label on the title row next to the step number. */
    title?: ReactNode;
    /** Supplementary text tight under the title; shown only while the step is active. */
    description?: ReactNode;
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

type YieldFlowStepListProps<TSequence extends readonly YieldFlowStepId[]> = {
    /** Ordered steps of the flow — every step in the sequence must be defined in `steps`. */
    sequence: TSequence;
    currentStep: YieldFlowStepId;
    steps: Record<TSequence[number], YieldFlowStepDefinition>;
    /** Renders the steps as an ordered StepList; without it only the current step's content shows. */
    hasStepList?: boolean;
};

export const YieldFlowStepList = <TSequence extends readonly YieldFlowStepId[]>({
    sequence,
    currentStep,
    steps,
    hasStepList = false,
}: YieldFlowStepListProps<TSequence>) => {
    // Widened — the prop is keyed by the flow's own steps, but we index it with generic step ids.
    const stepDefinitions: Partial<Record<YieldFlowStepId, YieldFlowStepDefinition>> = steps;
    const listSteps = sequence.filter(stepId => stepDefinitions[stepId]?.isListItem !== false);
    const views = getYieldFlowSteps(sequence, currentStep, listSteps);

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

                                <Column gap={4} width="100%">
                                    <Row
                                        justifyContent="space-between"
                                        alignItems="center"
                                        width="100%"
                                        gap={16}
                                    >
                                        {definition?.title}
                                        {definition?.rightContent?.(view)}
                                    </Row>

                                    {view.state === 'active' && definition?.description && (
                                        <Text
                                            typographyStyle="body-sm"
                                            intent="neutral"
                                            priority="secondary"
                                        >
                                            {definition.description}
                                        </Text>
                                    )}
                                </Column>
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
