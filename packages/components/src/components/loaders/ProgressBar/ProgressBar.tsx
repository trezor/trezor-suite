import styled from 'styled-components';

const Wrapper = styled.div`
    background: ${({ theme }) => theme.backgroundNeutralSubdued};
    width: 100%;
    overflow: hidden;
`;

type ValueProps = {
    $max: number;
    $value: number;
};

const Value = styled.div<ValueProps>`
    background: ${({ theme }) => theme.iconPrimaryDefault};
    height: 5px;
    max-width: 100%;
    width: 1%;
    transform: ${({ $max, $value }) => `scaleX(${(100 / $max) * $value})`};
    transform-origin: left;
    transition: transform 0.5s;
`;

export type ProgressBarProps = {
    max?: number;
    value: number;
};

export const ProgressBar = ({ max = 100, value, ...props }: ProgressBarProps) => (
    <Wrapper {...props}>
        <Value $max={max} $value={value} />
    </Wrapper>
);

ProgressBar.Value = Value;
