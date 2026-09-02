import { type ReactNode } from 'react';

import styled from 'styled-components';

import { type Color } from '@trezor/theme';

import { TableBody } from './TableBody';
import { TableCell } from './TableCell';
import { TableContext } from './TableContext';
import { TableHeader } from './TableHeader';
import { TableRow } from './TableRow';
import { type FrameProps, type FramePropsKeys, withFrameProps } from '../../utils/frameProps';
import { type TransientProps, makePropsTransient } from '../../utils/transientProps';
import { useScrollShadow } from '../../utils/useScrollShadow';
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

// The scroll shadow sentinels are positioned against this wrapper, so it has to be as wide as
// the table it holds — a plain block would end at the visible width and its right edge would
// never leave the viewport, no matter how far the table overflows.
const ScrollContent = styled.div`
    position: relative;
    min-width: min-content;
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
        backgroundColor?: Color;
    };

export const Table = ({
    children,
    margin,
    colWidths,
    isRowHighlightedOnHover = false,
    hasBorders = true,
    typographyStyle = 'body-md',
    backgroundColor = 'surfaceFillRaised',
}: TableProps) => {
    const { scrollElementRef, ScrollSentinels, ShadowContainer, ShadowRight, ShadowLeft } =
        useScrollShadow({
            backgroundColor,
        });

    return (
        <TableContext.Provider value={{ isRowHighlightedOnHover, hasBorders, typographyStyle }}>
            <ShadowContainer>
                <ShadowLeft />
                <ScrollContainer ref={scrollElementRef}>
                    <ScrollContent>
                        <ScrollSentinels />
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
                    </ScrollContent>
                </ScrollContainer>
                <ShadowRight />
            </ShadowContainer>
        </TableContext.Provider>
    );
};

Table.Row = TableRow;
Table.Cell = TableCell;
Table.Header = TableHeader;
Table.Body = TableBody;
