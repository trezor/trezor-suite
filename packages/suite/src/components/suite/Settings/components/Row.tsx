import React from 'react';
import styled from 'styled-components';

const Content = styled.div`
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: space-between;
    padding: 16px 0;
`;

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    padding: 0 24px;

    & + & {
        ${Content} {
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
