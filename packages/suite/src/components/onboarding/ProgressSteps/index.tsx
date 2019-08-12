import React from 'react';
import styled from 'styled-components';
import {
    ID_BACKUP_STEP,
    ID_SET_PIN_STEP,
    ID_NAME_STEP,
    ID_BOOKMARK_STEP,
    ID_NEWSLETTER_STEP,
} from '@suite/constants/onboarding/steps';
import { OnboardingActions } from '@suite/types/onboarding/onboarding';
import { Step, AnyStepId } from '@suite/types/onboarding/steps';
import colors from '@suite/config/onboarding/colors';

import ProgressStep from './components/ProgressStep';

const Wrapper = styled.div`
    width: 100%;
    height: 100%;
    justify-content: center;
    align-items: center;
    border-bottom: 1px solid ${colors.grayLight};
    display: ${({ isHidden }: { isHidden: boolean }) => (isHidden ? 'none' : 'flex')};
`;

const SECURITY_CLUSTER = [
    ID_BACKUP_STEP,
    ID_SET_PIN_STEP,
    ID_NAME_STEP,
    ID_BOOKMARK_STEP,
    ID_NEWSLETTER_STEP,
];

interface Props {
    isDisabled: boolean;
    onboardingActions: OnboardingActions;
    activeStep: Step;
    steps: Step[];
    hiddenOnSteps?: AnyStepId[];
}

class ProgressSteps extends React.Component<Props> {
    changeOverHowManySteps: number = 0;

    isGoingForward: boolean = true;

    componentWillReceiveProps(nextProps: Props) {
        if (nextProps.activeStep) {
            const nextStepIndex = this.props.steps.findIndex(
                (step: Step) => step.title === nextProps.activeStep.title,
            );
            const currentStepIndex = this.props.steps.findIndex(
                (step: Step) => step.title === this.props.activeStep.title,
            );
            this.isGoingForward = nextStepIndex > currentStepIndex;
            this.changeOverHowManySteps = Math.abs(nextStepIndex - currentStepIndex);
        }
    }

    getStepsWithDots() {
        const isSecurityActive = this.isSecurityActive();
        let steps: Step[] = [];
        if (isSecurityActive) {
            steps = this.props.steps.reduce(
                (accumulator: Step[], current: Step) => {
                    if (
                        SECURITY_CLUSTER.includes(current.id) &&
                        !accumulator.find(item => item.title === current.title)
                    ) {
                        accumulator.push(current);
                    }
                    return accumulator;
                },
                [
                    {
                        id: 'basic-setup',
                        title: 'Basic setup',
                    },
                ],
            );
        } else {
            steps = this.props.steps.reduce((accumulator: Step[], current: Step) => {
                if (
                    !SECURITY_CLUSTER.includes(current.id) &&
                    !accumulator.find(item => item.title === current.title)
                ) {
                    accumulator.push(current);
                }
                return accumulator;
            }, []);
            steps.push({
                title: 'Security',
                id: 'security',
            });
        }
        return steps.filter(step => step.title);
    }

    isSecurityActive() {
        return SECURITY_CLUSTER.includes(this.props.activeStep.id);
    }

    isStepFinished(index: number, activeStep: Step) {
        const activeStepIndex = this.getStepsWithDots().findIndex(
            (s: Step) => s.title === activeStep.title,
        );
        return activeStepIndex > index;
    }

    render() {
        const { isDisabled, onboardingActions, activeStep, hiddenOnSteps = [] } = this.props;
        const steps = this.getStepsWithDots();
        const isHidden = hiddenOnSteps.includes(activeStep.id);
        return (
            <Wrapper isHidden={isHidden}>
                {steps.map((step, index) => (
                    <ProgressStep
                        key={`${step.id}-${step.title}`}
                        isGoingForward={this.isGoingForward}
                        step={step}
                        index={index}
                        length={steps.length}
                        isActive={activeStep.title === step.title}
                        isFinished={this.isStepFinished(index, activeStep)}
                        isLast={steps.length - 1 === index}
                        onboardingActions={onboardingActions}
                        changeOverHowManySteps={this.changeOverHowManySteps}
                        isDisabled={isDisabled}
                    />
                ))}
            </Wrapper>
        );
    }
}

export default ProgressSteps;
