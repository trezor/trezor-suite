import React from 'react';
import styled from 'styled-components';
import { animations } from '../../../config';

interface Props {
    size: number;
    strokeWidth?: number;
    color?: string;
}

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
        border: ${props => (props.strokeWidth ? `${props.strokeWidth}px` : '1px')} solid transparent; /* change to 0.1em to scale based on used font-size */
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

export const FluidSpinner = ({ size, strokeWidth, color }: Props) => (
    <Wrapper size={size} strokeWidth={strokeWidth} color={color}>
        <div />
        <div />
        <div />
        <div />
    </Wrapper>
);
