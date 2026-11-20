import { Children, Fragment, type ReactNode, isValidElement } from 'react';

import styled from 'styled-components';

import { Column } from '@trezor/components';

import { type FlowStepState } from './FlowStep';

const StepConnectorLine = styled.div<{ $isPreviousStepDone: boolean }>`
    width: 4px;
    height: 16px;
    margin-left: 24px;
    background: ${({ theme, $isPreviousStepDone }) =>
        $isPreviousStepDone ? theme.borderBrand : theme.elementBorderNeutralSofter};
`;

type FlowStepListProps = {
    children: ReactNode;
    'data-testid'?: string;
};

export const FlowStepList = ({ children, 'data-testid': dataTest }: FlowStepListProps) => {
    const steps = Children.toArray(children).filter(step =>
        isValidElement<{ state?: FlowStepState }>(step),
    );

    return (
        <Column alignItems="stretch" data-testid={dataTest}>
            {steps.map((step, index) => (
                <Fragment key={step.key ?? index}>
                    {index > 0 && (
                        <StepConnectorLine
                            $isPreviousStepDone={steps[index - 1]?.props.state === 'done'}
                        />
                    )}
                    {step}
                </Fragment>
            ))}
        </Column>
    );
};
