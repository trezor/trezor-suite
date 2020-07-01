import React from 'react';
import styled, { css, keyframes } from 'styled-components';

export const FADE_IN = keyframes`
    0% {
        opacity: 0;
    }
    100% {
        opacity: 1;
    }
`;

interface Props {
    show?: boolean;
    className?: string;
    zIndex?: number;
    animated: boolean;
    onClick: () => void;
}

const StyledBackdrop = styled.div<Props>`
    width: 100%;
    height: 100%;
    position: fixed;
    z-index: ${props => props.zIndex ?? 2};
    left: 0;
    top: 0;
    background-color: rgba(0, 0, 0, 0.3);

    ${props =>
        props.animated &&
        css`
            animation: ${FADE_IN} 0.3s;
        `};
`;

const Backdrop = ({ className, show, animated, zIndex, onClick }: Props) =>
    show ? (
        <StyledBackdrop
            className={className}
            zIndex={zIndex}
            animated={animated}
            onClick={onClick}
        />
    ) : null;

export default Backdrop;
