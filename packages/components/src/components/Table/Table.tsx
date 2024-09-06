import { ReactNode } from 'react';
import styled from 'styled-components';

import { borders, Elevation, mapElevationToBackground } from '@trezor/theme';

import { TableHeader } from './TableHeader';
import { TableCell, TableCellProps } from './TableCell';
import { TableRow } from './TableRow';
import { useElevation } from '../ElevationContext/ElevationContext';
import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { TransientProps } from '../../utils/transientProps';

export const allowedTableFrameProps = ['margin'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedTableFrameProps)[number]>;

const Container = styled.table<{ $elevation: Elevation } & TransientProps<AllowedFrameProps>>`
    display: flex;
    width: 100%;
    flex-direction: column;
    background: ${mapElevationToBackground};
    border-radius: ${borders.radii.md};
    box-shadow: ${({ theme, $elevation }) => $elevation === 1 && theme.boxShadowBase};

    ${withFrameProps}
`;

interface TableProps {
    children: ReactNode;
}

export const Table = ({ children, ...rest }: TableProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedTableFrameProps);
    const { elevation } = useElevation();

    return (
        <Container $elevation={elevation} {...frameProps}>
            {children}
        </Container>
    );
};

Table.Row = TableRow;
Table.Cell = TableCell;
Table.HeaderRow = TableHeader;
Table.HeaderCell = (props: TableCellProps) => (
    <TableCell $isHeader {...props}>
        {props.children}
    </TableCell>
);

export default Table;
