import { type ReactNode } from 'react';

import styled from 'styled-components';

import { useTable } from './TableContext';
import { useTableHeader } from './TableHeader';
import { type UIAlignment } from '../../config/types';
import {
    type FrameProps,
    type FramePropsKeys,
    type Padding,
    withFrameProps,
} from '../../utils/frameProps';
import { type TransientProps } from '../../utils/transientProps';
import { type FlexJustifyContent } from '../Flex/FlexProp';
import { Text } from '../typography/Text/Text';

export const allowedTableCellFrameProps = [
    'padding',
    'width',
    'minWidth',
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
    $hasBorder: boolean;
};

const Cell = styled.td<CellProps>`
    text-align: left;
    overflow: hidden;

    ${withFrameProps}

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
    const { hasBorders, typographyStyle = 'body-md' } = useTable();

    const defaultPadding = {
        vertical: hasBorders ? 12 : 8,
        horizontal: 20,
    } satisfies Padding;

    return (
        <Cell
            as={isHeader ? 'th' : 'td'}
            colSpan={colSpan}
            $padding={padding ?? defaultPadding}
            $maxWidth={maxWidth}
            $hasBorder={hasBorders}
            data-testid={dataTestId}
        >
            <Text
                as="div"
                typographyStyle={isHeader ? 'body-sm' : typographyStyle}
                intent="neutral"
                priority={isHeader ? 'secondary' : 'primary'}
            >
                <Content $align={align}>{children}</Content>
            </Text>
        </Cell>
    );
};
