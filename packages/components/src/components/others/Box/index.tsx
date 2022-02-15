import React, { ReactNode } from 'react';
import styled, { css } from 'styled-components';
import { getStateColor } from '../../../utils/colors';
import { colors } from '../../../config';

export interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
    state?: 'success' | 'error' | 'warning';
    children: ReactNode;
}

const Wrapper = styled.div<{ state: BoxProps['state'] }>`
    display: flex;
    flex: 1;
    border-radius: 8px;
    padding: 16px 14px;
    border: solid 1px ${props => props.theme.STROKE_GREY};

    ${props =>
        props.state && css && `border-left: 6px solid ${getStateColor(props.state, props.theme)};`}
    ${props => !props.state && css && `padding-left: 20px`}
`;

const Box = ({ state, children, ...rest }: BoxProps) => (
    <Wrapper state={state} {...rest}>
        {children}
    </Wrapper>
);

export { Box };
