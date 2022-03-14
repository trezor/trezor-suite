import React from 'react';
import styled from 'styled-components';

const ProgressBarPlaceholder = styled.div`
    height: 4px;
    width: 100%;
    background-color: ${({ theme }) => theme.STROKE_GREY};
`;

const GreenBar = styled.div<{ width: number }>`
    height: 4px;
    position: relative;
    background-color: ${({ theme }) => theme.BG_GREEN};
    transition: all 0.5s;
    width: ${({ width }) => `${width}%`};
`;

type ProgressBarProps = {
    current: number;
    total: number;
};

export const ProgressBar = ({ current, total }: ProgressBarProps) => {
    const progress = total ? (100 / total) * current : 0;
    return (
        <ProgressBarPlaceholder>
            <GreenBar width={progress} />
        </ProgressBarPlaceholder>
    );
};
