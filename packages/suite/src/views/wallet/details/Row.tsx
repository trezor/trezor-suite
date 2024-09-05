import { spacingsPx } from '@trezor/theme';
import { ReactNode } from 'react';
import styled from 'styled-components';

const Container = styled.div`
    display: flex;
    flex: 1;
    justify-content: space-between;
    width: 100%;

    &:not(:first-child) {
        padding-top: ${spacingsPx.md};
        border-top: 1px solid ${({ theme }) => theme.legacy.STROKE_GREY};
    }
`;

interface RowProps {
    children: ReactNode;
}

export const Row = ({ children }: RowProps) => <Container>{children}</Container>;
