import { type ReactNode, createContext, useContext } from 'react';

const HeaderContext = createContext(false);

export interface TableHeaderProps {
    children: ReactNode;
}

export const TableHeader = ({ children }: TableHeaderProps) => (
    <HeaderContext.Provider value={true}>
        <thead data-component="TableHeader">{children}</thead>
    </HeaderContext.Provider>
);

export const useTableHeader = () => useContext(HeaderContext);
