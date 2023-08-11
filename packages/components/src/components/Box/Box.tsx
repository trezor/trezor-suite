import React, { ReactNode } from 'react';
import styled, { css } from 'styled-components';
import { getInputStateTextColor } from '../form/InputStyles';

export interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
    state?: 'success' | 'error' | 'warning';
    children: ReactNode;
}

const Wrapper = styled.div<{ state: BoxProps['state'] }>`
    display: flex;
    flex: 1;
    border-radius: 8px;
    padding: 16px 14px;
    border: solid 1px ${({ theme }) => theme.STROKE_GREY};

    ${({ state, theme }) =>
        state &&
        css`
            border-left: 6px solid ${getInputStateTextColor(state, theme)};
        `}
    ${({ state }) =>
        !state &&
        css`
            padding-left: 20px;
        `}
`;

const Box = ({ state, children, ...rest }: BoxProps) => (
    <Wrapper state={state} {...rest}>
        {children}
    </Wrapper>
);

export { Box };
