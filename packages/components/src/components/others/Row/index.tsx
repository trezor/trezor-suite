import React, { ReactNode } from 'react';
import styled from 'styled-components';
import { getStateColor } from '../../../utils/colors';
import { colors } from '../../../config';

interface Props {
    state?: 'success' | 'error' | 'warning';
    children: ReactNode;
    className?: string;
}

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    border-radius: 6px;
    border: solid 1px ${colors.NEUE_STROKE_GREY};
`;

const Line = styled.div<{ state: Props['state'] }>`
    height: 100%;
    border-top-left-radius: 6px;
    border-bottom-left-radius: 6px;
    width: 4px;
    background: ${props => getStateColor(props.state)};
`;

const Content = styled.div`
    padding: 15px 20px 15px 10px;
`;

const Row = ({ state, children, className }: Props) => {
    return (
        <Wrapper className={className}>
            {state && <Line state={state} />}
            <Content>{children}</Content>
        </Wrapper>
    );
};

export { Row, Props as RowProps };
