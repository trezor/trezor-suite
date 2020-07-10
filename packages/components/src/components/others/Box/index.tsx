import React, { ReactNode } from 'react';
import styled, { css } from 'styled-components';
import { getStateColor } from '../../../utils/colors';
import { colors } from '../../../config';

interface Props {
    state?: 'success' | 'error' | 'warning';
    children: ReactNode;
    className?: string;
}

const Wrapper = styled.div<{ state: Props['state'] }>`
    display: flex;
    flex: 1;
    border-radius: 6px;
    border: solid 1px ${colors.NEUE_STROKE_GREY};

    ${props => props.state && css && `border-left: 6px solid ${getStateColor(props.state)};`}
    ${props => !props.state && css && `padding-left: 6px`}
`;

const Content = styled.div`
    padding: 10px;
`;

const Box = ({ state, children, className }: Props) => {
    return (
        <Wrapper state={state} className={className}>
            <Content>{children}</Content>
        </Wrapper>
    );
};

export { Box, Props as BoxProps };
