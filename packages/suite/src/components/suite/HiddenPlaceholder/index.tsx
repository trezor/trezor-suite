import React, { ReactNode } from 'react';
import styled from 'styled-components';

interface WrapperProps {
    intensity: number;
}

const Wrapper = styled.span<WrapperProps>`
    filter: blur(${props => props.intensity || 4}px);
    transition: all 0.1s ease;

    &:hover {
        filter: none;
    }
`;

interface Props {
    children: ReactNode;
    discreetMode: boolean;
    intensity: number;
}

export default ({ children, discreetMode, intensity }: Props) => {
    if (!discreetMode) return children;
    return <Wrapper intensity={intensity}>{children}</Wrapper>;
};
