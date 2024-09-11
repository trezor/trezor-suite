import { ReactNode } from 'react';
import styled from 'styled-components';

import { typography, spacingsPx, Elevation, mapElevationToBackground } from '@trezor/theme';

import { useTableHeader } from './TableHeader';
import { UIHorizontalAlignment } from '../../config/types';
import { useElevation } from '../ElevationContext/ElevationContext';

export type TableCellProps = {
    children?: ReactNode;
    colSpan?: number;
    align?: UIHorizontalAlignment;
};

const mapAlignmentToJustifyContent = (align: UIHorizontalAlignment) => {
    const map: Record<UIHorizontalAlignment, string> = {
        left: 'flex-start',
        center: 'center',
        right: 'flex-end',
    };

    return map[align];
};

const Cell = styled.td<{ $isHeader: boolean; $elevation: Elevation }>`
    ${({ $isHeader }) => ($isHeader ? typography.hint : typography.body)}
    color: ${({ theme, $isHeader }) => ($isHeader ? theme.textSubdued : theme.textDefault)};
    text-align: left;
    padding: ${spacingsPx.sm} ${spacingsPx.lg};
    max-width: 300px;

    &:first-child {
        position: sticky;
        left: 0;
        z-index: 2;
        background: linear-gradient(to right, ${mapElevationToBackground} 90%, rgba(0 0 0 / 0%));
    }
`;

const Content = styled.div<{ $align: UIHorizontalAlignment }>`
    display: flex;
    justify-content: ${({ $align }) => mapAlignmentToJustifyContent($align)};
`;

export const TableCell = ({ children, colSpan = 1, align = 'left' }: TableCellProps) => {
    const isHeader = useTableHeader();
    const { parentElevation } = useElevation();

    return (
        <Cell
            as={isHeader ? 'th' : 'td'}
            colSpan={colSpan}
            $isHeader={isHeader}
            $elevation={parentElevation}
        >
            <Content $align={align}>{children}</Content>
        </Cell>
    );
};
