import { type ReactNode } from 'react';

import styled from 'styled-components';

import { mapElevationToBackgroundToken } from '@trezor/theme';

import { TableBody } from './TableBody';
import { TableCell } from './TableCell';
import { TableContext } from './TableContext';
import { TableHeader } from './TableHeader';
import { TableRow } from './TableRow';
import { type FrameProps, type FramePropsKeys, withFrameProps } from '../../utils/frameProps';
import { type TransientProps, makePropsTransient } from '../../utils/transientProps';
import { useScrollShadow } from '../../utils/useScrollShadow';
import { useElevation } from '../ElevationContext/ElevationContext';
import { type TextProps, type TextPropsKeys } from '../typography/utils';

export const allowedTableFrameProps = [
    'margin',
    'maxWidth',
    'width',
] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedTableFrameProps)[number]>;

export const allowedTableTextProps = ['typographyStyle'] as const satisfies TextPropsKeys[];
type AllowedTextProps = Pick<TextProps, (typeof allowedTableTextProps)[number]>;

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

export type TableProps = AllowedFrameProps &
    AllowedTextProps & {
        children: ReactNode;
        colWidths?: {
            minWidth?: string;
            maxWidth?: string;
            width?: string;
        }[];
        hasBorders?: boolean;
        isRowHighlightedOnHover?: boolean;
    };

export const Table = ({
    children,
    margin,
    colWidths,
    isRowHighlightedOnHover = false,
    hasBorders = true,
    typographyStyle = 'body-md',
}: TableProps) => {
    const { scrollElementRef, onScroll, ShadowContainer, ShadowRight } = useScrollShadow();
    const { parentElevation } = useElevation();

    return (
        <TableContext.Provider value={{ isRowHighlightedOnHover, hasBorders, typographyStyle }}>
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
                    backgroundColor={mapElevationToBackgroundToken({
                        $elevation: parentElevation,
                    })}
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
