import { ReactNode } from 'react';
import styled, { css } from 'styled-components';

import {
    Elevation,
    mapElevationToBackground,
    mapElevationToBorder,
    nextElevation,
} from '@trezor/theme';

import { useElevation } from '../ElevationContext/ElevationContext';
import { useTable } from './Table';
import { useTableHeader } from './TableHeader';

export const Row = styled.tr<{
    $elevation: Elevation;
    $isCollapsed: boolean;
    $isHighlighted: boolean;
    $isHeader: boolean;
}>`
    border-top: 1px solid ${mapElevationToBorder};

    &:first-child {
        border-top: 0;
    }

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
                        rgba(0 0 0 / 0%)
                    );
                }
            }
        `}

    ${({ $isCollapsed }) =>
        $isCollapsed &&
        css`
            visibility: collapse;
            border-top: 0;
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
    isHighlightedOnHover?: boolean;
    onClick?: () => void;
    onHover?: (isHovering: boolean) => void;
}

export const TableRow = ({
    children,
    isCollapsed = false,
    onClick,
    onHover,
    isHighlightedOnHover,
}: TableRowProps) => {
    const { elevation } = useElevation();
    const isHeader = useTableHeader();
    const { isRowHighlightedOnHover } = useTable();

    return (
        <Row
            $elevation={elevation}
            $isCollapsed={isCollapsed}
            $isHighlighted={isHighlightedOnHover ?? isRowHighlightedOnHover}
            $isHeader={isHeader}
            onClick={onClick}
            onMouseEnter={() => onHover?.(true)}
            onMouseLeave={() => onHover?.(false)}
        >
            {children}
        </Row>
    );
};
