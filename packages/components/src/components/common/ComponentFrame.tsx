import React from 'react';
import { Spacing, Spacings } from '@trezor/theme';
import styled from 'styled-components';

type SpacingValues = Spacings[Spacing];

export type FrameProps = {
    margin?: {
        top?: SpacingValues;
        bottom?: SpacingValues;
        left?: SpacingValues;
        right?: SpacingValues;
    };
    maxWidth?: string;
    fill?: boolean;
};

type ComponentFrameProps = FrameProps & {
    children: React.ReactNode;
};

const Frame = styled.div<{ $margin?: FrameProps['margin']; $fill: boolean }>`
    display: flex;
    flex: 1;

    width: ${({ $fill }) => ($fill ? '100%' : undefined)};

    ${({ $margin }) =>
        $margin &&
        `
            ${$margin.top ? `margin-top: ${$margin.top}px;` : ''}
            ${$margin.bottom ? `margin-bottom: ${$margin.bottom}px;` : ''}
            ${$margin.left ? `margin-left: ${$margin.left}px;` : ''}
            ${$margin.right ? `margin-right: ${$margin.right}px;` : ''}
  `};
`;

export const ComponentFrame = ({ children, margin, fill }: ComponentFrameProps) => (
    <Frame $margin={margin} $fill={fill}>
        {children}
    </Frame>
);
