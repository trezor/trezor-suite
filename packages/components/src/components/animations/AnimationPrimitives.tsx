import { borders } from '@trezor/theme';
import styled, { CSSProperties, css } from 'styled-components';

export type Shape = 'CIRCLE' | 'ROUNDED' | 'ROUNDED-SMALL';

export const AnimationWrapper = styled.div<{
    height?: CSSProperties['height'];
    width?: CSSProperties['width'];
    shape?: Shape;
}>`
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;

    width: ${({ width }) => width};
    height: ${({ height }) => height};

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
