import { ReactNode } from 'react';
import styled from 'styled-components';

import { Elevation, mapElevationToBorder, spacingsPx } from '@trezor/theme';

import { useElevation } from '../ElevationContext/ElevationContext';

export const Row = styled.tr<{ $elevation: Elevation }>`
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 1fr;
    align-items: center;
    margin: 0 ${spacingsPx.xl};
    padding: ${spacingsPx.lg} 0;
    border-bottom: 1px solid ${mapElevationToBorder};

    &:last-child {
        border-bottom: none;
    }
`;

export interface TableRowProps {
    children: ReactNode;
}

export const TableRow = ({ children }: TableRowProps) => {
    const { elevation } = useElevation();

    return <Row $elevation={elevation}>{children}</Row>;
};
