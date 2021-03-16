import React from 'react';
import styled from 'styled-components';
import { Icon, variables } from '@trezor/components';

export type ProgressBarStep = {
    label: string;
};

const ProgressBarWrapper = styled.div`
    display: flex;
    padding: 20px 0;
    width: 100%;
    justify-content: space-between;
    align-items: center;
`;

const StepWrapper = styled.div`
    display: flex;
    flex-direction: column;
    padding: 0 20px;
    align-items: center;
    align-self: center;
`;

const IconWrapper = styled.div<{ noBackground?: boolean; active?: boolean }>`
    display: flex;
    width: 32px;
    height: 32px;
    background: ${props => props.theme.BG_GREY};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-size: ${variables.NEUE_FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    align-items: center;
    justify-content: center;
    padding: 3px 2px 0 0;
    border-radius: 50%;

    ${props =>
        props.active &&
        `
            background: ${props.theme.BG_WHITE};
            box-shadow: 0 2px 5px 0 ${props.theme.BOX_SHADOW_BLACK_20};
            color: ${props.theme.TYPE_GREEN};
        `}
`;

const Label = styled.div<{ active?: boolean }>`
    text-align: center;
    margin: 10px 0 0 0;
    display: block;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-size: ${variables.NEUE_FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};

    ${props =>
        props.active &&
        `
            color: ${props.theme.TYPE_GREEN};
        `}
`;

const Divider = styled.div`
    flex-grow: 1;
    border-bottom: 1px solid ${props => props.theme.STROKE_GREY};
    margin: 20px;
`;

interface Props {
    steps: ProgressBarStep[];
    activeStep: number;
}

const ProgressBar = ({ steps, activeStep }: Props) => {
    return (
        <ProgressBarWrapper>
            {steps.map((step, stepKey) => {
                return (
                    <>
                        <StepWrapper>
                            {activeStep > stepKey + 1 ? (
                                <IconWrapper noBackground>
                                    <Icon icon="CHECK" />
                                </IconWrapper>
                            ) : (
                                <IconWrapper active={activeStep === stepKey + 1}>
                                    {stepKey + 1}
                                </IconWrapper>
                            )}
                            <Label active={activeStep === stepKey + 1}>{step.label}</Label>
                        </StepWrapper>
                        {stepKey < steps.length && <Divider />}
                    </>
                );
            })}
            <StepWrapper>
                <IconWrapper>
                    <img src="https://dummyimage.com/32x32&text=success+image" alt="" />
                </IconWrapper>
            </StepWrapper>
        </ProgressBarWrapper>
    );
};

export { ProgressBar };
