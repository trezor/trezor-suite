import { ReactNode, HTMLAttributes } from 'react';
import styled, { css } from 'styled-components';
import { getInputStateBorderColor } from '../form/InputStyles';
import { borders, spacingsPx } from '@trezor/theme';

export interface BoxProps extends HTMLAttributes<HTMLDivElement> {
    state?: 'success' | 'warning' | 'error';
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
            border-left: 6px solid ${getInputStateBorderColor(state, theme)};
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
