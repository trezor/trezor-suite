import { ReactNode } from 'react';

import styled from 'styled-components';

import { Elevation, mapElevationToBackground, spacings } from '@trezor/theme';

import { useTable } from './Table';
import { useTableHeader } from './TableHeader';
import { UIAlignment } from '../../config/types';
import { FrameProps, FramePropsKeys, withFrameProps } from '../../utils/frameProps';
import { TransientProps } from '../../utils/transientProps';
import { useElevation } from '../ElevationContext/ElevationContext';
import { FlexJustifyContent } from '../Flex/Flex';
import { Text } from '../typography/Text/Text';

export const allowedTableCellFrameProps = [
    'padding',
    'maxWidth',
] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedTableCellFrameProps)[number]>;

const mapAlignmentToJustifyContent = (align: UIAlignment): FlexJustifyContent => {
    const map: Record<UIAlignment, FlexJustifyContent> = {
        start: 'flex-start',
        center: 'center',
        end: 'flex-end',
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
        background: linear-gradient(to right, ${mapElevationToBackground} 90%, rgb(0 0 0 / 0%));

        ${({ $hasBorder }) => !$hasBorder && 'padding-left: 0;'}
    }

    &:last-child {
        ${({ $hasBorder }) => !$hasBorder && 'padding-right: 0;'}
    }
`;

const Content = styled.div<{ $align: UIAlignment }>`
    display: flex;
    justify-content: ${({ $align }) => mapAlignmentToJustifyContent($align)};
`;

export type TableCellProps = AllowedFrameProps & {
    children?: ReactNode;
    colSpan?: number;
    align?: UIAlignment;
    'data-testid'?: string;
};

export const TableCell = ({
    children,
    colSpan = 1,
    align = 'start',
    padding,
    maxWidth = 300,
    'data-testid': dataTestId,
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
            data-testid={dataTestId}
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
