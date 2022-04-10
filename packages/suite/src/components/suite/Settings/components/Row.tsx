import React from 'react';
import styled from 'styled-components';

const Content = styled.div`
    display: flex;
    flex: 1;
    justify-content: space-between;
    padding: 16px 0px;
`;

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    &:not(:first-child) {
        border-top: 1px solid ${props => props.theme.STROKE_GREY};
    }
`;

type RowProps = React.HTMLAttributes<HTMLDivElement>;

export const Row: React.FC<RowProps> = ({ children, ...rest }) => (
    <Wrapper>
        <Content {...rest}>{children}</Content>
    </Wrapper>
);
