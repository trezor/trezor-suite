import { createContext, ReactNode, useContext } from 'react';
import styled from 'styled-components';

import { mapElevationToBackgroundToken } from '@trezor/theme';
import { FrameProps, FramePropsKeys, withFrameProps } from '../../utils/frameProps';
import { makePropsTransient, TransientProps } from '../../utils/transientProps';
import { TableHeader } from './TableHeader';
import { TableCell } from './TableCell';
import { TableRow } from './TableRow';
import { TableBody } from './TableBody';
import { useScrollShadow } from '../../utils/useScrollShadow';
import { useElevation } from '../ElevationContext/ElevationContext';

export const allowedTableFrameProps = ['margin'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedTableFrameProps)[number]>;

interface TableContextProps {
    isRowHighlightedOnHover: boolean;
}

const TableContext = createContext<TableContextProps>({ isRowHighlightedOnHover: false });

export const useTable = () => useContext(TableContext);

const Container = styled.table<TransientProps<AllowedFrameProps>>`
    width: 100%;
    border-collapse: collapse;
    position: relative;

    ${withFrameProps}
`;

const ScrollContainer = styled.div`
    overflow: auto hidden;
    -webkit-overflow-scrolling: touch;
`;

export type TableProps = AllowedFrameProps & {
    children: ReactNode;
    colWidths?: {
        minWidth?: string;
        maxWidth?: string;
    }[];
    isRowHighlightedOnHover?: boolean;
};

export const Table = ({
    children,
    margin,
    colWidths,
    isRowHighlightedOnHover = false,
}: TableProps) => {
    const { scrollElementRef, onScroll, ShadowContainer, ShadowRight } = useScrollShadow();
    const { parentElevation } = useElevation();

    return (
        <TableContext.Provider value={{ isRowHighlightedOnHover }}>
            <ShadowContainer>
                <ScrollContainer onScroll={onScroll} ref={scrollElementRef}>
                    <Container {...makePropsTransient({ margin })}>
                        {colWidths && (
                            <colgroup>
                                {colWidths.map((widths, index) => (
                                    <col key={index} style={widths} />
                                ))}
                            </colgroup>
                        )}
                        {children}
                    </Container>
                </ScrollContainer>
                <ShadowRight
                    backgroundColor={mapElevationToBackgroundToken({ $elevation: parentElevation })}
                    style={{
                        borderRadius: '16px',
                    }}
                />
            </ShadowContainer>
        </TableContext.Provider>
    );
};

Table.Row = TableRow;
Table.Cell = TableCell;
Table.Header = TableHeader;
Table.Body = TableBody;
