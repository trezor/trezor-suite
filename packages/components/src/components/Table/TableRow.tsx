import { type ReactNode } from 'react';

import styled, { css } from 'styled-components';

import { useTable } from './TableContext';
import { useTableHeader } from './TableHeader';

export const Row = styled.tr<{
    $isCollapsed: boolean;
    $verticalAlign?: string;
    $isHighlighted: boolean;
    $isHeader: boolean;
    $hasBorderTop: boolean;
}>`
    ${({ $hasBorderTop, theme }) =>
        $hasBorderTop &&
        css`
            border-top: 1px solid ${theme.borderNeutral};
        `}

    thead &:first-child,
    tbody:first-child &:first-child,
    colgroup:first-child + tbody &:first-child {
        border-top: 0;
    }

    transition: background-color 0.2s;

    ${({ $verticalAlign }) => `vertical-align: ${$verticalAlign};`}

    ${({ $isHighlighted, theme, $isHeader }) =>
        $isHighlighted &&
        !$isHeader &&
        css`
            &:hover {
                background-color: ${theme.elementFillGhostHovered};
            }
        `}

    ${({ $isCollapsed }) =>
        $isCollapsed &&
        css`
            visibility: collapse;
            border-top: 1px;
            opacity: 0;
        `}

        ${({ onClick }) =>
        onClick &&
        css`
            &:hover {
                cursor: pointer;
            }
        `}
`;

export interface TableRowProps {
    children: ReactNode;
    isCollapsed?: boolean;
    verticalAlign?: string;
    isHighlightedOnHover?: boolean;
    onClick?: () => void;
    onHover?: (isHovering: boolean) => void;
    hasBorderTop?: boolean;
    'data-testid'?: string;
}

export const TableRow = ({
    children,
    isCollapsed = false,
    onClick,
    onHover,
    verticalAlign,
    isHighlightedOnHover,
    hasBorderTop,
    'data-testid': dataTestId,
}: TableRowProps) => {
    const isHeader = useTableHeader();
    const { isRowHighlightedOnHover, hasBorders } = useTable();

    return (
        <Row
            $verticalAlign={verticalAlign}
            $isCollapsed={isCollapsed}
            $isHighlighted={isHighlightedOnHover ?? isRowHighlightedOnHover}
            $isHeader={isHeader}
            $hasBorderTop={hasBorderTop ?? hasBorders}
            onClick={onClick}
            onMouseEnter={() => onHover?.(true)}
            onMouseLeave={() => onHover?.(false)}
            data-testid={dataTestId}
        >
            {children}
        </Row>
    );
};
