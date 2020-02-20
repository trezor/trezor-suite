import React from 'react';
import { Props } from './Container';
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

export default ({ children, discreetMode, intensity }: Props) => {
    if (!discreetMode) return children;
    return <Wrapper intensity={intensity}>{children}</Wrapper>;
};
