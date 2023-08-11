import React from 'react';
import styled from 'styled-components';
import { animations } from '../../config';

export interface FluidSpinnerProps {
    size?: number;
    strokeWidth?: number;
    color?: string;
    className?: string;
}

const Wrapper = styled.div<FluidSpinnerProps>`
    /* https://loading.io/css/ */
    position: relative;
    width: ${({ size }) => `${size}px`}; /* change to 1em to scale based on used font-size */
    height: ${({ size }) => `${size}px`}; /* change to 1em to scale based on used font-size */

    div {
        position: absolute;
        box-sizing: border-box;
        width: ${({ size }) => `${size}px`}; /* change to 1em to scale based on used font-size */
        height: ${({ size }) => `${size}px`}; /* change to 1em to scale based on used font-size */
        border: ${({ strokeWidth }) => `${strokeWidth}px`} solid transparent; /* change to 0.1em to scale based on used font-size */
        border-radius: 50%;
        animation: ${animations.SPIN} 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
        border-color: #fff transparent transparent transparent;
        border-top-color: ${({ color }) => color || 'inherit'};
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

export const Spinner = ({ size = 100, strokeWidth = 2, color, className }: FluidSpinnerProps) => (
    <Wrapper size={size} strokeWidth={strokeWidth} color={color} className={className}>
        <div />
        <div />
        <div />
        <div />
    </Wrapper>
);
