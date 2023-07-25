import React from 'react';
import styled, { css } from 'styled-components';
import { Icon, variables, useTheme } from '@trezor/components';

const ProgressBarWrapper = styled.div`
    display: flex;
    padding: 20px 0;
    width: 100%;
    /* prevents jumping in completed state with check mark icon shown */
    height: 64px;
    justify-content: space-between;
    align-items: center;
`;

const StepWrapper = styled.div<{ active: boolean }>`
    display: flex;
    flex-direction: column;
    padding: 0 20px;
    align-items: center;
    align-self: center;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.NEUE_FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};

    @media all and (max-width: ${variables.SCREEN_SIZE.LG}) {
        padding: 0;
    }

    ${({ active, theme }) =>
        active &&
        css`
            color: ${theme.TYPE_GREEN};
        `}
`;

const IconWrapper = styled.div<{ stepCompleted?: boolean; active?: boolean }>`
    display: flex;
    width: 32px;
    height: 32px;
    background: ${({ theme }) => theme.BG_GREY};
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-variant-numeric: tabular-nums;

    ${props =>
        props.stepCompleted &&
        css`
            background: ${({ theme }) => theme.BG_LIGHT_GREY};
        `}

    ${({ active, theme }) =>
        active &&
        css`
            background: ${theme.BG_WHITE};
            box-shadow: 0 2px 5px 0 ${theme.BOX_SHADOW_BLACK_20};
            color: ${theme.TYPE_GREEN};
        `}
`;

const Label = styled.div`
    text-align: center;
    margin: 10px 0 0 0;
    display: block;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.NEUE_FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        display: none;
    }
`;

const Divider = styled.div`
    flex-grow: 1;
    border-bottom: 1px solid ${({ theme }) => theme.STROKE_GREY};
    margin: 20px;

    @media (max-width: ${variables.SCREEN_SIZE.XL}) {
        margin: 15px;
    }

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        margin: 10px;
    }
`;

interface ProgressBarProps {
    steps: {
        key: string;
        label?: React.ReactNode;
    }[];
    activeStep?: number;
    className?: string;
}

export const ProgressBar = ({ steps, activeStep, className }: ProgressBarProps) => {
    const theme = useTheme();
    return (
        <ProgressBarWrapper className={className}>
            {steps.map((step, index) => {
                const stepCompleted = (activeStep ?? 0) > index;
                const stepActive = index === activeStep;
                return (
                    <React.Fragment key={step.key}>
                        <StepWrapper active={stepActive}>
                            <IconWrapper active={stepActive} stepCompleted={stepCompleted}>
                                {stepCompleted ? (
                                    <Icon icon="CHECK" color={theme.TYPE_GREEN} />
                                ) : (
                                    // TODO: Proper icon instead of emoji for last step
                                    <>{index === steps.length - 1 ? <>🎉</> : index + 1}</>
                                )}
                            </IconWrapper>
                            <Label>{step.label}</Label>
                        </StepWrapper>
                        {index < steps.length - 1 && <Divider />}
                    </React.Fragment>
                );
            })}
        </ProgressBarWrapper>
    );
};
