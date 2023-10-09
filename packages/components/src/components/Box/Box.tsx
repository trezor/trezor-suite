import { ReactNode, HTMLAttributes } from 'react';
import styled, { css, DefaultTheme } from 'styled-components';

export const getBoxStateBorderColor = (state: BoxState | undefined, theme: DefaultTheme) => {
    switch (state) {
        case 'warning':
            return theme.textAlertYellow;
        case 'error':
            return theme.borderAlertRed;
        case 'success':
        default:
            return theme.textPrimaryDefault;
    }
};

export type BoxState = 'success' | 'warning' | 'error';

export interface BoxProps extends HTMLAttributes<HTMLDivElement> {
    state?: BoxState;
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
            border-left: 6px solid ${getBoxStateBorderColor(state, theme)};
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
