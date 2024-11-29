import { ReactNode } from 'react';

import styled from 'styled-components';

import { spacings, Elevation, mapElevationToBackground } from '@trezor/theme';

import { useTableHeader } from './TableHeader';
import { useTable } from './Table';
import { Text } from '../typography/Text/Text';
import { FlexJustifyContent } from '../Flex/Flex';
import { UIHorizontalAlignment } from '../../config/types';
import { useElevation } from '../ElevationContext/ElevationContext';
import { FrameProps, FramePropsKeys, withFrameProps } from '../../utils/frameProps';
import { TransientProps } from '../../utils/transientProps';

export const allowedTableCellFrameProps = [
    'padding',
    'maxWidth',
] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedTableCellFrameProps)[number]>;

const mapAlignmentToJustifyContent = (align: UIHorizontalAlignment): FlexJustifyContent => {
    const map: Record<UIHorizontalAlignment, FlexJustifyContent> = {
        left: 'flex-start',
        center: 'center',
        right: 'flex-end',
    };

    return map[align];
};

type CellProps = TransientProps<AllowedFrameProps> & {
    $elevation: Elevation;
    $hasBorder: boolean;
};

const Cell = styled.td<CellProps>`
    text-align: left;
    overflow: hidden;

    ${withFrameProps}

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

export type TableCellProps = AllowedFrameProps & {
    children?: ReactNode;
    colSpan?: number;
    align?: UIHorizontalAlignment;
};

export const TableCell = ({
    children,
    colSpan = 1,
    align = 'left',
    padding,
    maxWidth = 300,
}: TableCellProps) => {
    const isHeader = useTableHeader();
    const { hasBorders, typographyStyle } = useTable();
    const { parentElevation } = useElevation();

    const defaultPadding = {
        vertical: hasBorders ? spacings.sm : spacings.xs,
        horizontal: spacings.lg,
    };

    const defaultTypographyStyle = isHeader ? 'hint' : 'body';

    return (
        <Cell
            as={isHeader ? 'th' : 'td'}
            colSpan={colSpan}
            $elevation={parentElevation}
            $padding={padding ?? defaultPadding}
            $maxWidth={maxWidth}
            $hasBorder={hasBorders}
        >
            <Text
                as="div"
                typographyStyle={typographyStyle ?? defaultTypographyStyle}
                variant={isHeader ? 'tertiary' : 'default'}
            >
                <Content $align={align}>{children}</Content>
            </Text>
        </Cell>
    );
};
