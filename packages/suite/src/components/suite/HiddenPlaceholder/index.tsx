import React from 'react';
import { Props } from './Container';
import styled, { css } from 'styled-components';

interface WrapperProps {
    intensity: number;
    discreetMode: boolean;
}

const Wrapper = styled.span<WrapperProps>`
    ${(props: WrapperProps) =>
        props.discreetMode &&
        css`
            transition: all 0.1s ease;
            filter: blur(${(props: WrapperProps) => props.intensity}px);

            &:hover {
                filter: none;
            }
        `}
`;

export default ({ children, discreetMode, intensity = 5, className }: Props) => (
    <Wrapper discreetMode={discreetMode} intensity={intensity} className={className}>
        {children}
    </Wrapper>
);
