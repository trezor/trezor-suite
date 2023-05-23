import React from 'react';
import styled, { css } from 'styled-components';
import { transparentize } from 'polished';

import { variables } from '@trezor/components';

const Wrapper = styled.div<{ size?: string; isHoverable?: boolean }>`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;

    ::after {
        content: '';
        position: absolute;
        width: 100%;
        height: 100%;
        transform: scale(0.5);
        border-radius: 8px;
        transition: ${props =>
            `all ${props.theme.HOVER_TRANSITION_TIME} ${props.theme.HOVER_TRANSITION_EFFECT}`};

        background-color: transparent;
        pointer-events: none;
        z-index: ${variables.Z_INDEX.BASE};
    }

    ${props =>
        props.isHoverable &&
        css`
            :hover,
            :focus,
            :active {
                ::after {
                    transform: scale(1);
                    background-color: ${props =>
                        transparentize(
                            props.theme.HOVER_TRANSPARENTIZE_FILTER,
                            props.theme.HOVER_PRIMER_COLOR,
                        )};
                }
            }
        `}
`;

interface HoverAnimationProps {
    isHoverable?: boolean;
    children: React.ReactNode;
    className?: string;
}

export const HoverAnimation = ({
    isHoverable = true,
    className,
    children,
}: HoverAnimationProps) => (
    <Wrapper isHoverable={isHoverable} className={className}>
        {children}
    </Wrapper>
);
