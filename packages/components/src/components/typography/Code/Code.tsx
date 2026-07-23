import { type ReactNode } from 'react';

import styled from 'styled-components';

const StyledCode = styled.code`
    font-family: RobotoMono, 'PixelOperatorMono8', monospace;
    display: inline;
    font-size: inherit;
    line-height: 1.5;
    font-weight: 400;
    letter-spacing: -0.4px;
    padding: 0 ${() => '2px'};
    background-color: ${({ theme }) => theme.elementFillNeutralSoft};
    box-shadow: inset 0 0 0 1px ${({ theme }) => theme.borderNeutral};
    border-radius: 4px;
`;

export const Code = ({ children }: { children: ReactNode }) => <StyledCode>{children}</StyledCode>;
