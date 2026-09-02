import { type ReactNode, type Ref } from 'react';

import styled, { css } from 'styled-components';

import { useTable } from './TableContext';
import { useTableHeader } from './TableHeader';

export const Row = styled.tr<{
    $isCollapsed: boolean;
    $verticalAlign?: string;
    $isHighlightedOnHover: boolean;
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

    ${({ $isHighlightedOnHover, theme, $isHeader, $isHighlighted }) =>
        $isHighlightedOnHover &&
        !$isHeader &&
        !$isHighlighted &&
        css`
            &:hover {
                background-color: ${theme.elementFillGhostHovered};
            }
        `}

    ${({ $isHighlighted, theme }) =>
        $isHighlighted &&
        css`
            background-color: ${theme.elementFillWarningSofter};
            outline: solid 2px ${theme.elementBorderWarningSofter};
            outline-offset: -2px;
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
    /** Keeps the row highlighted, e.g. while it is the target of an anchor navigation. */
    isHighlighted?: boolean;
    onClick?: () => void;
    onHover?: (isHovering: boolean) => void;
    hasBorderTop?: boolean;
    ref?: Ref<HTMLTableRowElement>;
    'data-testid'?: string;
}

export const TableRow = ({
    children,
    isCollapsed = false,
    onClick,
    onHover,
    verticalAlign,
    isHighlightedOnHover,
    isHighlighted = false,
    hasBorderTop,
    ref,
    'data-testid': dataTestId,
}: TableRowProps) => {
    const isHeader = useTableHeader();
    const { isRowHighlightedOnHover, hasBorders } = useTable();

    return (
        <Row
            $verticalAlign={verticalAlign}
            $isCollapsed={isCollapsed}
            $isHighlightedOnHover={isHighlightedOnHover ?? isRowHighlightedOnHover}
            $isHighlighted={isHighlighted}
            $isHeader={isHeader}
            $hasBorderTop={hasBorderTop ?? hasBorders}
            ref={ref}
            onClick={onClick}
            onMouseEnter={() => onHover?.(true)}
            onMouseLeave={() => onHover?.(false)}
            data-testid={dataTestId}
        >
            {children}
        </Row>
    );
};
