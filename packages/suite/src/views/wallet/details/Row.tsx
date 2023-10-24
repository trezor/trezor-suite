import { HTMLAttributes } from 'react';
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
        border-top: 1px solid ${({ theme }) => theme.STROKE_GREY};
    }
`;

type RowProps = HTMLAttributes<HTMLDivElement>;

export const Row = ({ children, ...rest }: RowProps) => (
    <Wrapper>
        <Content {...rest}>{children}</Content>
    </Wrapper>
);
