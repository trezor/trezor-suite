import { ReactNode } from 'react';
import styled, { css } from 'styled-components';

import { Elevation, mapElevationToBorder } from '@trezor/theme';

import { useElevation } from '../ElevationContext/ElevationContext';

export const Row = styled.tr<{ $elevation: Elevation; $isCollapsed: boolean }>`
    border-top: 1px solid ${mapElevationToBorder};

    &:first-child {
        border-top: 0;
    }

    ${({ $isCollapsed }) =>
        $isCollapsed &&
        css`
            visibility: collapse;
            border-top: 0;
            opacity: 0;
        `}
`;

export interface TableRowProps {
    children: ReactNode;
    isCollapsed?: boolean;
}

export const TableRow = ({ children, isCollapsed = false }: TableRowProps) => {
    const { elevation } = useElevation();

    return (
        <Row $elevation={elevation} $isCollapsed={isCollapsed}>
            {children}
        </Row>
    );
};
