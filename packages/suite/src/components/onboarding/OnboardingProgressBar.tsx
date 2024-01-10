import { ReactNode, Fragment } from 'react';
import styled, { css, useTheme } from 'styled-components';
import { Icon, variables } from '@trezor/components';
import { boxShadows, spacingsPx, typography } from '@trezor/theme';

const ProgressBarWrapper = styled.div`
    display: flex;
    padding: ${spacingsPx.lg} 0;
    width: 100%;

    /* prevents jumping in completed state with check mark icon shown */
    height: 64px;
    justify-content: space-between;
    align-items: flex-start;
`;

const StepWrapper = styled.div<{ active: boolean }>`
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

    ${({ active, theme }) =>
        active &&
        css`
            color: ${theme.textPrimaryDefault};
        `}
`;

const IconWrapper = styled.div<{ stepCompleted?: boolean; active?: boolean }>`
    display: flex;
    width: 32px;
    height: 32px;
    background: ${({ theme }) => theme.backgroundNeutralSubtleOnElevation1};
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-variant-numeric: tabular-nums;

    ${props =>
        props.stepCompleted &&
        css`
            background: transparent;
        `}

    ${({ active, theme }) =>
        active &&
        css`
            background: ${theme.backgroundSurfaceElevation1};
            box-shadow: ${boxShadows.elevation1};
            color: ${theme.textPrimaryDefault};
        `}
`;

const Label = styled.div`
    text-align: center;
    margin: 10px 0 0;
    display: block;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    ${typography.label}

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        display: none;
    }
`;

const Divider = styled.div`
    flex-grow: 1;
    border-bottom: 1px solid ${({ theme }) => theme.borderOnElevation0};
    margin: ${spacingsPx.md} ${spacingsPx.lg};

    @media (max-width: ${variables.SCREEN_SIZE.XL}) {
        margin: ${spacingsPx.md};
    }

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        margin: ${spacingsPx.md} ${spacingsPx.sm};
    }
`;

const ConfettiIcon = styled(Icon)`
    margin-left: 1px;
`;

interface OnboardingProgressBarProps {
    steps: {
        key: string;
        label?: ReactNode;
    }[];
    activeStep?: number;
    className?: string;
}

export const OnboardingProgressBar = ({
    steps,
    activeStep,
    className,
}: OnboardingProgressBarProps) => {
    const theme = useTheme();
    return (
        <ProgressBarWrapper className={className}>
            {steps.map((step, index) => {
                const stepCompleted = (activeStep ?? 0) > index;
                const stepActive = index === activeStep;
                return (
                    <Fragment key={step.key}>
                        <StepWrapper active={stepActive}>
                            <IconWrapper active={stepActive} stepCompleted={stepCompleted}>
                                {stepCompleted ? (
                                    <Icon icon="CHECK" color={theme.TYPE_GREEN} />
                                ) : (
                                    <>
                                        {index === steps.length - 1 ? (
                                            <ConfettiIcon
                                                icon="CONFETTI_SUCCESS"
                                                size={20}
                                                color={stepActive ? theme.TYPE_GREEN : undefined}
                                            />
                                        ) : (
                                            index + 1
                                        )}
                                    </>
                                )}
                            </IconWrapper>
                            <Label>{step.label}</Label>
                        </StepWrapper>
                        {index < steps.length - 1 && <Divider />}
                    </Fragment>
                );
            })}
        </ProgressBarWrapper>
    );
};
