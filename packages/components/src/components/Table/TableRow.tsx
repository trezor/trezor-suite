import { type ReactNode } from 'react';

import styled, { css } from 'styled-components';

import {
    type Elevation,
    mapElevationToBackground,
    mapElevationToBorder,
    nextElevation,
} from '@trezor/theme';

import { useTable } from './TableContext';
import { useTableHeader } from './TableHeader';
import { useElevation } from '../ElevationContext/ElevationContext';

export const Row = styled.tr<{
    $elevation: Elevation;
    $isCollapsed: boolean;
    $verticalAlign?: string;
    $isHighlighted: boolean;
    $isHeader: boolean;
    $hasBorderTop: boolean;
}>`
    ${({ $hasBorderTop, theme, $elevation }) =>
        $hasBorderTop &&
        css`
            border-top: 1px solid ${mapElevationToBorder({ theme, $elevation })};
        `}

    &:first-child {
        border-top: 0;
    }
    ${({ $verticalAlign }) => `vertical-align: ${$verticalAlign};`}

    ${({ $isHighlighted, theme, $elevation, $isHeader }) =>
        $isHighlighted &&
        !$isHeader &&
        css`
            &:hover {
                background-color: ${mapElevationToBackground({
                    theme,
                    $elevation: nextElevation[$elevation],
                })};

                & > td:first-child {
                    background: linear-gradient(
                        to right,
                        ${mapElevationToBackground({
                                theme,
                                $elevation: nextElevation[$elevation],
                            })}
                            90%,
                        rgb(0 0 0 / 0%)
                    );
                }
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
    const { elevation } = useElevation();
    const isHeader = useTableHeader();
    const { isRowHighlightedOnHover, hasBorders } = useTable();

    return (
        <Row
            $elevation={elevation}
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
