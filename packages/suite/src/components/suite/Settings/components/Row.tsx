import { variables } from '@trezor/components';
import React from 'react';
import styled from 'styled-components';

const { SCREEN_SIZE } = variables;

const Content = styled.div`
    display: flex;
    justify-content: space-between;
    flex: 1;
    padding: 16px 0;

    @media all and (max-width: ${SCREEN_SIZE.SM}) {
        flex-direction: column;
    }
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

interface Props {
    children: React.ReactNode;
}

export default ({ children }: Props) => (
    <Wrapper>
        <Content>{children}</Content>
    </Wrapper>
);
