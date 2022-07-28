import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
    background: ${({ theme }) => theme.STROKE_GREY};
    width: 100%;
`;

const Value = styled.div<{ $max: number; $value: number; isRed: boolean }>`
    background: ${({ theme, isRed }) => (isRed ? theme.BG_RED : theme.BG_GREEN)};
    height: 4px;
    max-width: 100%;
    transition: width 0.5s;
    width: ${({ $max, $value }) => (100 / $max) * $value}%;
`;

type ProgressProps = {
    max?: number;
    value: number;
    isRed?: boolean;
};

// HTML progress element is not used because styling is browser-dependent (no consistent way to override styles
// from parent component, no straightforward way to add width transition in Firefox)
export const Progress = ({ max = 100, value, isRed = false, ...props }: ProgressProps) => (
    <Wrapper {...props}>
        <Value $max={max} $value={value} isRed={isRed} />
    </Wrapper>
);

Progress.Value = Value;
