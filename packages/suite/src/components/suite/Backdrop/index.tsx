import React from 'react';
import styled, { css } from 'styled-components';
import { FADE_IN } from '@trezor/components/src/config/animations';

interface Props {
    show?: boolean;
    className?: string;
    zIndex?: number;
    animated: boolean;
    onClick?: () => void;
}

const StyledBackdrop = styled.div<Props>`
    width: 100%;
    height: 100%;
    left: 0;
    position: fixed;
    z-index: ${props => props.zIndex ?? 2};
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
