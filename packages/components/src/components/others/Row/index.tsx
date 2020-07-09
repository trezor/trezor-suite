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
    padding: 16px 14px;
    border: solid 1px ${colors.NEUE_STROKE_GREY};

    ${props => props.state && css && `border-left: 6px solid ${getStateColor(props.state)};`}
    ${props => !props.state && css && `padding-left: 20px`}
`;

const Row = ({ state, children, className }: Props) => {
    return (
        <Wrapper state={state} className={className}>
            {children}
        </Wrapper>
    );
};

export { Row, Props as RowProps };
