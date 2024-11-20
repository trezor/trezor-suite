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
import { useTable } from './Table';
import { Text } from '../typography/Text/Text';
import { UIHorizontalAlignment } from '../../config/types';
import { useElevation } from '../ElevationContext/ElevationContext';

type Padding = {
    top?: SpacingValues;
    bottom?: SpacingValues;
    left?: SpacingValues;
    right?: SpacingValues;
    vertical?: SpacingValues;
    horizontal?: SpacingValues;
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

const Cell = styled.td<{
    $isHeader: boolean;
    $elevation: Elevation;
    $padding?: Padding;
    $hasBorder: boolean;
}>`
    ${({ $isHeader }) => ($isHeader ? typography.hint : typography.body)}
    color: ${({ theme, $isHeader }) => ($isHeader ? theme.textSubdued : theme.textDefault)};
    text-align: left;
    max-width: 300px;
    overflow: hidden;

    ${({ $padding }) =>
        $padding &&
        css`
            padding: ${$padding.top ?? $padding.vertical ?? 0}px
                ${$padding.right ?? $padding.horizontal ?? 0}px
                ${$padding.bottom ?? $padding.vertical ?? 0}px
                ${$padding.left ?? $padding.horizontal ?? 0}px;
        `}

    &:first-child {
        position: sticky;
        left: 0;
        z-index: 2;
        background: linear-gradient(to right, ${mapElevationToBackground} 90%, rgba(0 0 0 / 0%));

        ${({ $hasBorder }) => !$hasBorder && 'padding-left: 0;'}
    }

    &:last-child {
        ${({ $hasBorder }) => !$hasBorder && 'padding-right: 0;'}
    }
`;

const Content = styled.div<{ $align: UIHorizontalAlignment }>`
    display: flex;
    justify-content: ${({ $align }) => mapAlignmentToJustifyContent($align)};
`;

export const TableCell = ({ children, colSpan = 1, align = 'left', padding }: TableCellProps) => {
    const isHeader = useTableHeader();
    const { hasBorders, typographyStyle } = useTable();
    const { parentElevation } = useElevation();
    const defaultPadding = {
        vertical: hasBorders ? spacings.sm : spacings.xs,
        horizontal: spacings.lg,
    };

    return (
        <Cell
            as={isHeader ? 'th' : 'td'}
            colSpan={colSpan}
            $isHeader={isHeader}
            $elevation={parentElevation}
            $padding={padding ?? defaultPadding}
            $hasBorder={hasBorders}
        >
            <Text as="div" typographyStyle={typographyStyle}>
                <Content $align={align}>{children}</Content>
            </Text>
        </Cell>
    );
};
