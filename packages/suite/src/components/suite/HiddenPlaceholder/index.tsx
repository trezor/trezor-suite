import React, { ReactNode } from 'react';
import styled from 'styled-components';

interface WrapperProps {
    intensity: number;
    showOnHover: boolean;
}

const Wrapper = styled.span<WrapperProps>`
    filter: blur(${props => props.intensity || 4}px);
    transition: all 0.1s ease;

    &:hover {
        filter: none;
    }
`;

interface Props {
    showOnHover: boolean;
    children: ReactNode;
    discreetMode: boolean;
    intensity: number;
}

export default ({ showOnHover = true, children, discreetMode, intensity }: Props) => {
    if (!discreetMode) return children;
    return (
        <Wrapper intensity={intensity} showOnHover={showOnHover}>
            {children}
        </Wrapper>
    );
};
