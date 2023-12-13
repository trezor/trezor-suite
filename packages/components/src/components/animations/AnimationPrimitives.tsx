import { borders } from '@trezor/theme';
import styled, { css } from 'styled-components';

export type Shape = 'CIRCLE' | 'ROUNDED' | 'ROUNDED-SMALL';

export const AnimationWrapper = styled.div<{ size?: number; shape?: Shape }>`
    width: 100%;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;

    ${({ size }) =>
        size &&
        css`
            width: max-content;
            height: ${size}px;
        `}
    ${({ shape }) =>
        shape === 'CIRCLE' &&
        css`
            border-radius: 50%;
        `};
    ${({ shape }) =>
        shape === 'ROUNDED' &&
        css`
            border-radius: 30px;
        `};
    ${({ shape }) =>
        shape === 'ROUNDED-SMALL' &&
        css`
            border-radius: ${borders.radii.xs};
        `};
`;
