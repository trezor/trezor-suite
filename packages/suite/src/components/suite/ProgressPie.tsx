import React from 'react';
import styled from 'styled-components';

const Container = styled.div<{
    progress: number;
    size: number;
    color?: string;
    backgroundColor?: string;
}>`
    display: flex;
    justify-content: center;
    align-items: center;
    width: ${({ size }) => `${size}px`};
    height: ${({ size }) => `${size}px`};
    border-radius: 50%;
    background: ${({ theme, progress, color, backgroundColor }) =>
        `conic-gradient(${color || theme.BG_GREEN} ${3.6 * progress}deg, ${
            backgroundColor || theme.STROKE_GREY
        } 0)`};
`;

interface ProgressPieInterface {
    progress: number;
    size?: number;
    color?: string;
    backgroundColor?: string;
    children?: React.ReactNode;
    className?: string;
}

export const ProgressPie = ({ size = 16, children, ...props }: ProgressPieInterface) => (
    <Container size={size} {...props}>
        {children}
    </Container>
);
