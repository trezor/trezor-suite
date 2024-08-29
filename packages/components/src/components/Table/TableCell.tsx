import { ReactNode } from 'react';
import styled from 'styled-components';

import { typography } from '@trezor/theme';

import { FrameProps, FramePropsKeys, withFrameProps } from '../../utils/frameProps';
import { makePropsTransient, TransientProps } from '../../utils/transientProps';

export const allowedTableCellFrameProps: FramePropsKeys[] = ['margin'];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedTableCellFrameProps)[number]>;

export type TableCellProps = AllowedFrameProps & {
    children?: ReactNode;
    align?: 'left' | 'right';
    isHeader?: boolean;
    isSmaller?: boolean;
};

type TableCellContainerProps = {
    $align?: 'left' | 'right';
    $isHeader: boolean;
    $isSmaller?: boolean;
} & TransientProps<AllowedFrameProps>;

const TableCellContainer = styled.div<TableCellContainerProps>`
    ${({ $isHeader }) => ($isHeader ? typography.hint : typography.body)}
    color: ${({ theme, $isHeader }) => ($isHeader ? theme.textSubdued : theme.textDefault)};
    display: flex;
    align-items: center;
    justify-self: ${({ $align }) => ($align === 'right' ? 'right' : 'left')};
    grid-column: ${({ $isSmaller }) => ($isSmaller ? 'span 1' : 'span 3')};

    ${withFrameProps}
`;

export const TableCell = ({
    children,
    align = 'left',
    isHeader = false,
    isSmaller,
    ...props
}: TableCellProps) => {
    const transientProps = makePropsTransient(props);

    return (
        <TableCellContainer
            $isSmaller={isSmaller}
            $align={align}
            $isHeader={isHeader}
            {...transientProps}
        >
            {children}
        </TableCellContainer>
    );
};
