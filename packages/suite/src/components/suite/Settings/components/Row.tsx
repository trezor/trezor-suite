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
    & + & {
        border-top: 1px solid ${props => props.theme.STROKE_GREY};
    }
`;

interface Props extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

const Row = ({ children, ...rest }: Props) => (
    <Wrapper>
        <Content {...rest}>{children}</Content>
    </Wrapper>
);

export default Row;
