import React from 'react';
import styled, { css } from 'styled-components';
import { transparentize } from 'polished';

const Wrapper = styled.div<{ size?: string; isHoverable?: boolean }>`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    &:after {
        content: '';
        position: absolute;
        top: -4px;
        left: -4px;
        right: -4px;
        bottom: -4px;
        z-index: 1;
        border-radius: 8px;
        transition: ${props =>
            `all ${props.theme.HOVER_TRANSITION_TIME} ${props.theme.HOVER_TRANSITION_EFFECT}`};

        background-color: transparent;
        pointer-events: none;
    }

    ${props =>
        props.isHoverable &&
        css`
            &:hover,
            &:focus,
            &:active {
                &:after {
                    background-color: ${props =>
                        transparentize(
                            props.theme.HOVER_TRANSPARENTIZE_FILTER,
                            props.theme.HOVER_PRIMER_COLOR
                        )};
                    ${props.size === 'tiny'
                        ? css`
                              top: -8px;
                              left: -8px;
                              bottom: -8px;
                              right: -8px;
                          `
                        : css`
                              top: -12px;
                              left: -12px;
                              bottom: -12px;
                              right: -12px;
                          `}
                }
            }
        `}
`;

const HoverAnimation: React.FC<{ size?: string; isHoverable?: boolean }> = ({
    children,
    size,
    isHoverable,
}) => (
    <Wrapper size={size} isHoverable={isHoverable}>
        {children}
    </Wrapper>
);

export { HoverAnimation };
