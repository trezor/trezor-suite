import React from 'react';
import styled from 'styled-components';
import { colors, animations } from '../../../config';

const Wrapper = styled.div<Props>`
    /* https://loading.io/css/ */
    position: relative;
    width: ${props => `${props.size}px`}; /* change to 1em to scale based on used font-size */
    height: ${props => `${props.size}px`}; /* change to 1em to scale based on used font-size */

    div {
        position: absolute;
        box-sizing: border-box;
        width: ${props => `${props.size}px`}; /* change to 1em to scale based on used font-size */
        height: ${props => `${props.size}px`}; /* change to 1em to scale based on used font-size */
        border: ${props => `${props.strokeWidth}px`} solid transparent; /* change to 0.1em to scale based on used font-size */
        border-radius: 50%;
        animation: ${animations.SPIN} 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
        border-color: #fff transparent transparent transparent;
        border-top-color: ${props => (props.color ? props.color : 'inherit')};
        will-change: transform;
    }

    div:nth-child(1) {
        animation-delay: -0.45s;
    }

    div:nth-child(2) {
        animation-delay: -0.3s;
    }

    div:nth-child(3) {
        animation-delay: -0.15s;
    }
`;

const getStrokeWidthForSize = (size: number) => {
    return size >= 32 ? 2 : 1;
};

interface Props {
    size: number;
    strokeWidth?: number;
    color?: string;
}

const Spinner = ({ size, strokeWidth, color = colors.NEUE_TYPE_GREEN }: Props) => (
    <Wrapper size={size} strokeWidth={strokeWidth ?? getStrokeWidthForSize(size)} color={color}>
        <div />
        <div />
        <div />
        <div />
    </Wrapper>
);

export { Spinner, Props as SpinnerProps };
