import styled from 'styled-components';

import { SpacingValues, SpacingValuesNew } from '@trezor/theme';

import { GridAlignItems, GridJustifyContent } from './types';
import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { TransientProps } from '../../utils/transientProps';

export const allowedGridFrameProps: FramePropsKeys[] = [
    'margin',
    'padding',
    'width',
    'height',
    'flex',
];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedGridFrameProps)[number]>;

const Container = styled.div<
    TransientProps<AllowedFrameProps> & {
        $columns: number | string;
        $rowGap: SpacingValues | SpacingValuesNew;
        $columnGap: SpacingValues | SpacingValuesNew;
        $alignItems: GridAlignItems;
        $justifyContent: GridJustifyContent;
        $forceEqualColumns: boolean;
    }
>`
    display: grid;
    gap: ${({ $rowGap, $columnGap }) => `${$rowGap}px ${$columnGap}px`};
    grid-template-columns: ${({ $columns, $forceEqualColumns }) =>
        typeof $columns === 'number'
            ? `repeat(${$columns}, minmax(${$forceEqualColumns ? '0' : 'min-content'}, 1fr))`
            : $columns};
    align-items: ${({ $alignItems }) => $alignItems};
    justify-content: ${({ $justifyContent }) => $justifyContent};

    ${withFrameProps}
`;

export type GridProps = AllowedFrameProps & {
    gap?: SpacingValues | SpacingValuesNew;
    rowGap?: SpacingValues | SpacingValuesNew;
    columnGap?: SpacingValues | SpacingValuesNew;
    alignItems?: GridAlignItems;
    justifyContent?: GridJustifyContent;
    columns: number | string;
    children: React.ReactNode;
    forceEqualColumns?: boolean;
};

export const Grid = ({
    columns,
    gap = 0,
    rowGap = gap,
    columnGap = gap,
    alignItems = 'normal',
    justifyContent = 'normal',
    children,
    forceEqualColumns = false,
    ...rest
}: GridProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedGridFrameProps);

    return (
        <Container
            $columns={columns}
            $rowGap={rowGap}
            $columnGap={columnGap}
            $forceEqualColumns={forceEqualColumns}
            $alignItems={alignItems}
            $justifyContent={justifyContent}
            {...frameProps}
        >
            {children}
        </Container>
    );
};
