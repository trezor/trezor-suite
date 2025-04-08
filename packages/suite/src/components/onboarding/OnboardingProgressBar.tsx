import { Fragment } from 'react';

import styled, { css, useTheme } from 'styled-components';

import { Icon, variables } from '@trezor/components';
import { spacingsPx, typography } from '@trezor/theme';

import { progressBarSteps } from '../../config/onboarding/steps';
import { ProgressBarStepKey } from '../../types/onboarding';
import { Translation } from '../suite';

const ProgressBarWrapper = styled.div`
    display: flex;
    padding: ${spacingsPx.lg} 0;
    width: 100%;

    /* prevents jumping in completed state with check mark icon shown */
    height: 64px;
    justify-content: space-between;
    align-items: flex-start;
`;

const StepWrapper = styled.div<{ $active: boolean }>`
    display: flex;
    flex-direction: column;
    padding: 0 ${spacingsPx.lg};
    align-items: center;
    align-self: flex-start;
    color: ${({ theme }) => theme.textSubdued};
    ${typography.highlight};

    @media all and (max-width: ${variables.SCREEN_SIZE.LG}) {
        padding: 0;
    }

    ${({ $active, theme }) =>
        $active &&
        css`
            color: ${theme.textPrimaryDefault};
        `}
`;

const IconWrapper = styled.div<{ $stepCompleted?: boolean; $active?: boolean }>`
    display: flex;
    width: 32px;
    height: 32px;
    background: ${({ theme }) => theme.backgroundNeutralSubtleOnElevation1};
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-variant-numeric: tabular-nums;

    ${props =>
        props.$stepCompleted &&
        css`
            background: transparent;
        `}

    ${({ $active, theme }) =>
        $active &&
        css`
            background: ${theme.backgroundSurfaceElevation1};
            box-shadow: ${({ theme }) => theme.boxShadowBase};
            color: ${theme.textPrimaryDefault};
        `}
`;

const Label = styled.div`
    text-align: center;
    margin: 10px 0 0;
    display: block;
    color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
    ${typography.label}

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        display: none;
    }
`;

const Divider = styled.div`
    flex-grow: 1;
    border-bottom: 1px solid ${({ theme }) => theme.borderElevation1};
    margin: ${spacingsPx.md} ${spacingsPx.lg};

    @media (max-width: ${variables.SCREEN_SIZE.XL}) {
        margin: ${spacingsPx.md};
    }

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        margin: ${spacingsPx.md} ${spacingsPx.sm};
    }
`;

interface OnboardingProgressBarProps {
    activeStepGroup?: ProgressBarStepKey;
    className?: string;
}

export const OnboardingProgressBar = ({
    activeStepGroup,
    className,
}: OnboardingProgressBarProps) => {
    const theme = useTheme();

    const lastStepNumber = progressBarSteps.length - 1;
    const indexOfActiveStep = progressBarSteps.findIndex(({ key }) => key === activeStepGroup);

    return (
        <ProgressBarWrapper className={className}>
            {progressBarSteps.map(({ key, labelTranslationId }, index) => {
                // if active step was not found (-1) because activeStepGroup is undefined, no step will be considered completed
                const stepCompleted = indexOfActiveStep > index;
                const stepActive = index === indexOfActiveStep;

                return (
                    <Fragment key={key}>
                        <StepWrapper $active={stepActive}>
                            <IconWrapper $active={stepActive} $stepCompleted={stepCompleted}>
                                {stepCompleted ? (
                                    <Icon name="check" color={theme.legacy.TYPE_GREEN} />
                                ) : (
                                    <>
                                        {index === lastStepNumber ? (
                                            <Icon
                                                name="confetti"
                                                size={20}
                                                color={
                                                    stepActive ? theme.legacy.TYPE_GREEN : undefined
                                                }
                                            />
                                        ) : (
                                            index + 1
                                        )}
                                    </>
                                )}
                            </IconWrapper>
                            {labelTranslationId ? (
                                <Label>
                                    <Translation id={labelTranslationId} />
                                </Label>
                            ) : null}
                        </StepWrapper>
                        {index < lastStepNumber && <Divider />}
                    </Fragment>
                );
            })}
        </ProgressBarWrapper>
    );
};
