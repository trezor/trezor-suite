import { SpacingValues } from '@trezor/theme';
import styled from 'styled-components';
import { FrameProps, FramePropsKeys, withFrameProps } from '../../utils/frameProps';
import { makePropsTransient, TransientProps } from '../../utils/transientProps';

export const allowedGridFrameProps: FramePropsKeys[] = ['margin', 'width', 'height'];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedGridFrameProps)[number]>;

const Container = styled.div<
    TransientProps<AllowedFrameProps> & {
        $columns: number;
        $gap: SpacingValues;
    }
>`
    display: grid;
    gap: ${({ $gap }) => $gap}px;
    grid-template-columns: repeat(${({ $columns }) => $columns}, 1fr);
    ${withFrameProps}
`;

export type GridProps = AllowedFrameProps & {
    gap?: SpacingValues;
    columns: number;
    children: React.ReactNode;
};

export const Grid = ({ gap = 0, columns, children, margin, width, height }: GridProps) => (
    <Container
        {...makePropsTransient({
            gap,
            columns,
            margin,
            width,
            height,
        })}
    >
        {children}
    </Container>
);
