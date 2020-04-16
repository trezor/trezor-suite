import React from 'react';
import styled from 'styled-components';

const Content = styled.div`
    display: flex;
    flex: 1;
    justify-content: space-between;
    padding: 16px 24px;
`;

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    & + & {
        &::before {
            content: '';
            margin: 0 auto;
            width: 94%;
            border-top: 1px solid rgba(0, 0, 0, 0.1);
        }
    }
`;

interface Props extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export default ({ children, ...rest }: Props) => (
    <Wrapper>
        <Content {...rest}>{children}</Content>
    </Wrapper>
);
