import { ReactNode } from 'react';

import { TableHeader } from './TableHeader';
import { TableCell, TableCellProps } from './TableCell';
import { TableRow } from './TableRow';
import { FrameProps, FramePropsKeys } from '../../utils/frameProps';
import { TableBody } from './TableBody';
import { Card } from '../Card/Card';

export const allowedTableFrameProps = ['margin'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedTableFrameProps)[number]>;

type TableProps = {
    children: ReactNode;
} & AllowedFrameProps;

export const Table = ({ children, margin }: TableProps) => (
    <Card paddingType="none" margin={margin}>
        <table>{children}</table>
    </Card>
);

Table.Row = TableRow;
Table.Cell = TableCell;
Table.HeaderRow = TableHeader;
Table.HeaderCell = (props: TableCellProps) => (
    <TableCell isHeader {...props}>
        {props.children}
    </TableCell>
);
Table.Body = TableBody;

export default Table;
