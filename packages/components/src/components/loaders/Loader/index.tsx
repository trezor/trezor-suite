import React from 'react';
import styled, { css } from 'styled-components';

import { SPIN } from '../../../config/animations';
import colors from '../../../config/colors';

const Wrapper = styled.div<Props>`
    position: relative;
    width: ${props => `${props.size}px`};
    height: ${props => `${props.size}px`};
    display: flex;
    justify-content: center;
    align-items: center;
`;

const SvgWrapper = styled.svg`
    position: absolute;
    width: 100%;
    height: 100%;
    transform-origin: center center;
`;

const StyledLoader = styled.div<{ size: number, strokeWidth: number }>`
    position: relative;
    text-indent: -9999em;
    border-top: ${props => `${props.strokeWidth}px`} solid ${colors.GREEN};
    border-right: ${props => `${props.strokeWidth}px`} solid ${colors.GREEN};
    border-bottom: ${props => `${props.strokeWidth}px`} solid ${colors.GREEN};
    border-left: ${props => `${props.strokeWidth}px`} solid transparent;
    transform: translateZ(0);
    animation: ${SPIN} 0.6s infinite linear;
    &,
    &:after {
        border-radius: 50%;
        width: ${props => `${props.size}px`};
        height: ${props => `${props.size}px`};
    } 
`;

interface Props {
    className?: string;
    size?: number;
    strokeWidth?: number;
}

const Loader = ({
    className,
    size = 100,
    strokeWidth = 2,
    ...rest
}: Props) => (
    <Wrapper className={className} size={size} {...rest}>
        <StyledLoader size={size} strokeWidth={strokeWidth} />
    </Wrapper>
);

export { Loader, Props as LoaderProps };
