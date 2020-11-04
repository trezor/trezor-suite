import React from 'react';
import styled from 'styled-components';

import { SPIN } from '../../../config/animations';

const Wrapper = styled.div<Props>`
    position: relative;
    width: ${props => `${props.size}px`};
    height: ${props => `${props.size}px`};
    display: flex;
    justify-content: center;
    align-items: center;
`;

const StyledLoader = styled.div<{ size: number; strokeWidth: number }>`
    position: relative;
    text-indent: -9999em;
    border-top: ${props => `${props.strokeWidth}px`} solid ${props => props.theme.TYPE_GREEN};
    border-right: ${props => `${props.strokeWidth}px`} solid ${props => props.theme.TYPE_GREEN};
    border-bottom: ${props => `${props.strokeWidth}px`} solid ${props => props.theme.TYPE_GREEN};
    border-left: ${props => `${props.strokeWidth}px`} solid transparent;
    transform: translateZ(0);
    animation: ${SPIN} 1s infinite linear;
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

const Loader = ({ className, size = 100, strokeWidth = 2, ...rest }: Props) => (
    <Wrapper className={className} size={size} {...rest}>
        <StyledLoader size={size} strokeWidth={strokeWidth} />
    </Wrapper>
);

export { Loader, Props as LoaderProps };
