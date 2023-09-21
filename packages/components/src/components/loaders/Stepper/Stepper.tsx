import styled from 'styled-components';
import { borders, spacingsPx } from '@trezor/theme';

const Container = styled.div<{ maxWidth: number }>`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xxs};
    width: 100%;
    max-width: ${({ maxWidth }) => maxWidth}px;
    padding: ${spacingsPx.xs};
`;

const Step = styled.div<{ isActive: boolean }>`
    width: 100%;
    height: 2px;
    border-radius: ${borders.radii.full};
    transition: background-color 0.2s;
    background: ${({ theme, isActive }) =>
        isActive ? theme.backgroundPrimaryDefault : theme.backgroundNeutralSubdued};
`;

export interface StepperProps {
    /**
     * @description 1-based .
     */
    step: number;
    total: number;
    maxWidth?: number;
}

export const Stepper = ({ step, total, maxWidth = 200 }: StepperProps) => {
    const steps = Array(total)
        .fill(null)
        .map((_, index) => {
            const isActive = index < step;

            return <Step isActive={isActive} />;
        });

    return <Container maxWidth={maxWidth}>{steps}</Container>;
};
