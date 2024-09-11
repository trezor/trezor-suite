import { createContext, useContext, ReactNode } from 'react';
import styled from 'styled-components';

import { Elevation, mapElevationToBorder } from '@trezor/theme';

import { useElevation } from '../ElevationContext/ElevationContext';

const HeaderContext = createContext(false);

const Header = styled.thead<{ $elevation: Elevation }>`
    border-bottom: 1px solid ${mapElevationToBorder};
`;

export interface TableHeaderProps {
    children: ReactNode;
}

export const TableHeader = ({ children }: TableHeaderProps) => {
    const { elevation } = useElevation();

    return (
        <HeaderContext.Provider value={true}>
            <Header $elevation={elevation}>{children}</Header>
        </HeaderContext.Provider>
    );
};

export const useTableHeader = () => useContext(HeaderContext);
