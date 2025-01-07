import { ReactNode } from 'react';

export interface TableFooterProps {
    children: ReactNode;
}

export const TableFooter = ({ children }: TableFooterProps) => {
    return <tbody>{children}</tbody>;
};
