import styled from 'styled-components';

import { type SpacingValuesNew } from '@trezor/theme';

import { BulletListContext } from './BulletListContext';
import { BulletListItem } from './BulletListItem';
import { type BulletLineWidth, type BulletListDirection, type BulletSize } from './types';
import {
    type FrameProps,
    type FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { type TransientProps } from '../../utils/transientProps';

export type { BulletListItemState } from './types';

export const allowedBulletListFrameProps = [
    'margin',
    'width',
    'overflow',
    'flex',
] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedBulletListFrameProps)[number]>;

const Container = styled.ul<
    TransientProps<AllowedFrameProps> & { $direction: BulletListDirection }
>`
    display: flex;
    list-style-type: none;
    flex-direction: ${({ $direction }) => ($direction === 'vertical' ? 'column' : 'row')};
    align-items: stretch;
    counter-reset: item-counter;

    ${withFrameProps}
`;

export type BulletListProps = AllowedFrameProps & {
    gap?: SpacingValuesNew;
    bulletGap?: SpacingValuesNew;
    titleGap?: SpacingValuesNew;
    isOrdered?: boolean;
    bulletSize?: BulletSize;
    lineWidth?: BulletLineWidth;
    direction?: BulletListDirection;
    children: React.ReactNode;
    'data-testid'?: string;
};

export const BulletList = ({
    gap = 32,
    bulletGap = 24,
    titleGap = 8,
    isOrdered = false,
    bulletSize = 'large',
    lineWidth = 2,
    direction = 'vertical',
    'data-testid': dataTestId,
    children,
    ...rest
}: BulletListProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedBulletListFrameProps);

    return (
        <BulletListContext.Provider
            value={{
                itemGap: gap,
                bulletGap,
                titleGap,
                isOrdered,
                bulletSize,
                lineWidth,
                direction,
            }}
        >
            <Container data-testid={dataTestId} {...frameProps} $direction={direction}>
                {children}
            </Container>
        </BulletListContext.Provider>
    );
};

BulletList.Item = BulletListItem;
