import { borders } from '@trezor/theme';
import styled from 'styled-components';

const Wrapper = styled.div`
    background: ${({ theme }) => theme.backgroundNeutralSubdued};
    width: 100%;
    border-radius: ${borders.radii.full};
`;

type ValueProps = {
    $max: number;
    $value: number;
    isRed: boolean;
};

const Value = styled.div.attrs<ValueProps>(({ $max, $value }) => ({
    style: {
        width: `${(100 / $max) * $value}%`,
    },
}))<ValueProps>`
    background: ${({ theme, isRed }) => (isRed ? theme.borderAlertRed : theme.borderSecondary)};
    height: 5px;
    max-width: 100%;
    transition: width 0.5s;
`;

type ProgressBarProps = {
    max?: number;
    value: number;
    isRed?: boolean;
};

// HTML progress element is not used because styling is browser-dependent (no consistent way to override styles
// from parent component, no straightforward way to add width transition in Firefox)
export const ProgressBar = ({ max = 100, value, isRed = false, ...props }: ProgressBarProps) => (
    <Wrapper {...props}>
        <Value $max={max} $value={value} isRed={isRed} />
    </Wrapper>
);

ProgressBar.Value = Value;
