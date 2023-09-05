import { ReactNode } from 'react';
import styled from 'styled-components';

const Container = styled.div`
    display: flex;
    flex: 1;
    padding-bottom: 16px;

    :not(:first-child) {
        padding-top: 16px;
        border-top: 1px solid ${({ theme }) => theme.STROKE_GREY};
    }
`;

interface RowProps {
    children: ReactNode;
}

export const Row = ({ children }: RowProps) => <Container>{children}</Container>;
