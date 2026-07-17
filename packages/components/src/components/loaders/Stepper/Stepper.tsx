import styled from 'styled-components';

const Container = styled.div<{ $maxWidth: number }>`
    display: flex;
    align-items: center;
    gap: 4px;
    width: 100%;
    max-width: ${({ $maxWidth }) => $maxWidth}px;
    padding: 8px;
`;

const Step = styled.div<{ $isActive: boolean }>`
    width: 100%;
    height: 2px;
    border-radius: calc(infinity * 1px);
    transition: background-color 0.2s;
    background: ${({ theme, $isActive }) =>
        $isActive ? theme.elementFillFieldSelected : theme.elementFillNeutralBold};
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

            return <Step key={`${index}`} $isActive={isActive} />;
        });

    return <Container $maxWidth={maxWidth}>{steps}</Container>;
};
