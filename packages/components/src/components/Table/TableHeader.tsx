import { ReactNode } from 'react';
import styled from 'styled-components';

import { Elevation, mapElevationToBorder, spacingsPx } from '@trezor/theme';

import { useElevation } from '../ElevationContext/ElevationContext';

export const Header = styled.thead<{ $elevation: Elevation }>`
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 1fr;
    align-items: center;
    padding: ${spacingsPx.sm} ${spacingsPx.xl};
    border-bottom: 1px solid ${mapElevationToBorder};
`;

export interface TableHeaderProps {
    children: ReactNode;
}

export const TableHeader = ({ children }: TableHeaderProps) => {
    const { elevation } = useElevation();

    return <Header $elevation={elevation}>{children}</Header>;
};
