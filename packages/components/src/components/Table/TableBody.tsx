import { type ReactNode } from 'react';

export interface TableBodyProps {
    children: ReactNode;
}

export const TableBody = ({ children }: TableBodyProps) => (
    <tbody data-component="TableBody">{children}</tbody>
);
