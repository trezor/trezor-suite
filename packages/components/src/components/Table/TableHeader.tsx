import { createContext, useContext, ReactNode } from 'react';

import styled from 'styled-components';

import { Elevation, mapElevationToBorder } from '@trezor/theme';

import { useElevation } from '../ElevationContext/ElevationContext';
import { useTable } from './Table';

const HeaderContext = createContext(false);

const Header = styled.thead<{ $elevation: Elevation; $hasBorder: boolean }>`
    border-bottom: 1px solid ${mapElevationToBorder};
    ${({ $hasBorder }) => !$hasBorder && 'border-bottom: 0;'}
`;

export interface TableHeaderProps {
    children: ReactNode;
}

export const TableHeader = ({ children }: TableHeaderProps) => {
    const { elevation } = useElevation();
    const { hasBorders } = useTable();

    return (
        <HeaderContext.Provider value={true}>
            <Header $elevation={elevation} $hasBorder={hasBorders}>
                {children}
            </Header>
        </HeaderContext.Provider>
    );
};

export const useTableHeader = () => useContext(HeaderContext);
