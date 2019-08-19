import React from 'react';
import styled from 'styled-components';

import colors from '@suite/config/onboarding/colors';
import { Step } from '@suite/types/onboarding/steps';

import Line from './Line';

const ProgressStepWrapper = styled.div`
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    flex-grow: 1;
`;

const Circle = styled.div`
    border: 1.2px solid;
    height: 12px;
    width: 12px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 0.82rem;
`;

const Text = styled.div`
    color: ${colors.brandPrimary};
    margin-top: 5px;
    font-size: 0.8rem;
`;

const LINE_TRANSITION_DURATION = 0.25;

interface Props {
    isActive: boolean;
    isDisabled: boolean;
    isFinished: boolean;
    isLast: boolean;
    isGoingForward: boolean;
    step: Step;
    index: number;
    length: number;
    changeOverHowManySteps: number;
}

const ProgressStep = (props: Props) => {
    const color = props.isActive ? colors.brandPrimary : colors.gray;
    const borderColor = props.isActive || props.isFinished ? colors.brandPrimary : colors.gray;
    let backgroundColor;
    if (props.isActive) {
        backgroundColor = 'transparent';
    } else if (props.isFinished) {
        backgroundColor = colors.brandPrimary;
    }

    // const isClickable = Boolean(props.isFinished && !props.isDisabled && props.step.id);
    const isClickable = false;

    let order;
    if (props.isGoingForward) {
        order = props.changeOverHowManySteps;
    } else {
        order = 2 * props.changeOverHowManySteps;
    }

    return (
        <ProgressStepWrapper>
            <Line
                transitionDuration={LINE_TRANSITION_DURATION}
                isActive={(!props.isFinished && !props.isActive) || props.index === 0}
                order={props.isGoingForward ? order + 1 : order - props.index * 2}
                isFirst={props.index === 0}
            />
            <Circle
                data-test={`step-${props.step.id}`}
                style={{
                    borderColor,
                    color,
                    backgroundColor,
                    cursor: isClickable ? 'pointer' : 'initial',
                    transition: `all ${LINE_TRANSITION_DURATION}s linear`,
                    transitionDelay: props.isGoingForward
                        ? `${LINE_TRANSITION_DURATION * 2}s`
                        : `${LINE_TRANSITION_DURATION * (order - props.index * 2)}s`,
                }}
            />

            <Line
                transitionDuration={LINE_TRANSITION_DURATION}
                isActive={!props.isFinished}
                order={props.isGoingForward ? order : order - props.index * 2 - 1}
                isLast={props.isLast}
            />

            <Text
                style={{
                    color: props.isFinished || props.isActive ? colors.brandPrimary : colors.gray,
                    transition: props.isActive
                        ? `color 0.2s ${LINE_TRANSITION_DURATION * 2}s linear`
                        : '',
                    cursor: isClickable ? 'pointer' : 'initial',
                    flexBasis: '100%',
                    textAlign: 'center',
                }}
            >
                {props.step.title}
            </Text>
        </ProgressStepWrapper>
    );
};

export default ProgressStep;
