import styled from 'styled-components';

import { SpacingValues } from '@trezor/theme';

import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { TransientProps } from '../../utils/transientProps';

export const allowedGridFrameProps: FramePropsKeys[] = ['margin', 'width', 'height', 'flex'];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedGridFrameProps)[number]>;

const Container = styled.div<
    TransientProps<AllowedFrameProps> & {
        $columns: number;
        $gap: SpacingValues;
        $forceEqualColumns: boolean;
    }
>`
    display: grid;
    gap: ${({ $gap }) => $gap}px;
    grid-template-columns:
        ${({ $columns, $forceEqualColumns }) =>
            `repeat(${$columns}, minmax(${$forceEqualColumns ? '0' : 'min-content'}, 1fr));`}
        ${withFrameProps};
`;

export type GridProps = AllowedFrameProps & {
    gap?: SpacingValues;
    columns: number;
    children: React.ReactNode;
    forceEqualColumns?: boolean;
};

export const Grid = ({
    columns,
    gap = 0,
    children,
    forceEqualColumns = false,
    ...rest
}: GridProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedGridFrameProps);

    return (
        <Container
            $columns={columns}
            $gap={gap}
            $forceEqualColumns={forceEqualColumns}
            {...frameProps}
        >
            {children}
        </Container>
    );
};
