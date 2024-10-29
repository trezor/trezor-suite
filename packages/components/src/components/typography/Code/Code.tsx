import { borders, spacingsPx } from '@trezor/theme';
import React, { type ReactNode } from 'react';
import styled from 'styled-components';

const StyledCode = styled.code`
    font-family: RobotoMono, 'PixelOperatorMono8', monospace;
    display: inline;
    font-size: inherit;
    line-height: 1.5;
    font-weight: 400;
    letter-spacing: -0.4px;
    padding: 0 ${() => spacingsPx.xxxs};
    background-color: ${({ theme }) => theme.backgroundNeutralSubtleOnElevation1};
    box-shadow: inset 0 0 0 1px ${({ theme }) => theme.borderElevation0};
    border-radius: ${() => borders.radii.xxs};
`;

export const Code: React.FC<{ children: ReactNode }> = ({ children }) => {
    return <StyledCode>{children}</StyledCode>;
};
