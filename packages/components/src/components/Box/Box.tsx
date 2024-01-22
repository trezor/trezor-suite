import { ReactNode, HTMLAttributes } from 'react';
import styled, { DefaultTheme, css } from 'styled-components';
import { borders, spacingsPx } from '@trezor/theme';

// TODO: since the fate of Box is unclear, decouple it from the input state
// later those "state" styles should be unified across components
export const getBoxStateBorderColor = (
    state: BoxProps['state'] | undefined,
    theme: DefaultTheme,
) => {
    switch (state) {
        case 'warning':
            return theme.textAlertYellow;
        case 'error':
            return theme.borderAlertRed;
        case 'success':
            return theme.borderSecondary;
        default:
            return 'transparent';
    }
};
export interface BoxProps extends HTMLAttributes<HTMLDivElement> {
    state?: 'warning' | 'error' | 'success';
    children: ReactNode;
}

const Wrapper = styled.div<{ state: BoxProps['state'] }>`
    display: flex;
    flex: 1;
    border-radius: ${borders.radii.sm};
    padding: ${spacingsPx.md};
    border: solid 1px ${({ theme }) => theme.borderOnElevation0};

    ${({ state, theme }) =>
        state &&
        css`
            border-left: 6px solid ${getBoxStateBorderColor(state, theme)};
        `}
    ${({ state }) =>
        !state &&
        css`
            padding-left: ${spacingsPx.lg};
        `}
`;

const Box = ({ state, children, ...rest }: BoxProps) => (
    <Wrapper state={state} {...rest}>
        {children}
    </Wrapper>
);

export { Box };
