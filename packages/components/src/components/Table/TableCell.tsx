import { ReactNode } from 'react';
import styled, { css } from 'styled-components';

import {
    typography,
    spacings,
    Elevation,
    mapElevationToBackground,
    SpacingValues,
} from '@trezor/theme';

import { useTableHeader } from './TableHeader';
import { UIHorizontalAlignment } from '../../config/types';
import { useElevation } from '../ElevationContext/ElevationContext';

type Padding = {
    top?: SpacingValues;
    bottom?: SpacingValues;
    left?: SpacingValues;
    right?: SpacingValues;
};

export type TableCellProps = {
    children?: ReactNode;
    colSpan?: number;
    align?: UIHorizontalAlignment;
    padding?: Padding;
};

const mapAlignmentToJustifyContent = (align: UIHorizontalAlignment) => {
    const map: Record<UIHorizontalAlignment, string> = {
        left: 'flex-start',
        center: 'center',
        right: 'flex-end',
    };

    return map[align];
};

const Cell = styled.td<{ $isHeader: boolean; $elevation: Elevation; $padding?: Padding }>`
    ${({ $isHeader }) => ($isHeader ? typography.hint : typography.body)}
    color: ${({ theme, $isHeader }) => ($isHeader ? theme.textSubdued : theme.textDefault)};
    text-align: left;
    max-width: 300px;
    overflow: hidden;

    ${({ $padding }) =>
        $padding &&
        css`
            padding: ${$padding.top ?? 0}px ${$padding.right ?? 0}px ${$padding.bottom ?? 0}px
                ${$padding.left ?? 0}px;
        `}

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

export const TableCell = ({
    children,
    colSpan = 1,
    align = 'left',
    padding = { top: spacings.sm, right: spacings.lg, bottom: spacings.sm, left: spacings.lg },
}: TableCellProps) => {
    const isHeader = useTableHeader();
    const { parentElevation } = useElevation();

    return (
        <Cell
            as={isHeader ? 'th' : 'td'}
            colSpan={colSpan}
            $isHeader={isHeader}
            $elevation={parentElevation}
            $padding={padding}
        >
            <Content $align={align}>{children}</Content>
        </Cell>
    );
};
