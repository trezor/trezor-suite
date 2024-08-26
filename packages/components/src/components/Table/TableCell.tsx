import { spacingsPx, typography } from '@trezor/theme';
import { ReactNode } from 'react';
import styled, { css } from 'styled-components';

export interface TableCellProps {
    children: ReactNode;
    $alignRight?: boolean;
    $isHeader?: boolean;
}

export const TableCell = styled(({ $isHeader, $alignRight, ...props }: TableCellProps) =>
    $isHeader ? <th {...props} /> : <td {...props} />,
)<TableCellProps>`
    ${({ $isHeader }) => ($isHeader ? typography.hint : typography.body)}
    color: ${({ theme, $isHeader }) => ($isHeader ? theme.textSubdued : theme.textDefault)};
    display: flex;
    align-items: center;
    justify-self: left;

    ${({ $alignRight }) =>
        $alignRight &&
        css`
            justify-self: right;
            padding-right: ${spacingsPx.xxxl};
        `}
`;
