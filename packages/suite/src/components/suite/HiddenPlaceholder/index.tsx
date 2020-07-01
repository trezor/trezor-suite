import React from 'react';
import styled, { css } from 'styled-components';

import { Props } from './Container';

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

export default ({ children, discreetMode, intensity = 4, className }: Props) => (
    <Wrapper discreetMode={discreetMode} intensity={intensity} className={className}>
        {children}
    </Wrapper>
);
