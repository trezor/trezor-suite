import { createContext, useContext } from 'react';

import styled from 'styled-components';

import { spacings, SpacingValues } from '@trezor/theme';

import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { TransientProps } from '../../utils/transientProps';
import { BulletListItem } from './BulletListItem';
import { BulletSize } from './types';

export type { BulletListItemState } from './types';

export const allowedBulletListFrameProps = [
    'margin',
    'width',
    'overflow',
    'flex',
] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedBulletListFrameProps)[number]>;

const Container = styled.ul<TransientProps<AllowedFrameProps>>`
    display: flex;
    list-style-type: none;
    flex-direction: column;
    align-items: stretch;
    counter-reset: item-counter;

    ${withFrameProps}
`;

export type BulletListProps = AllowedFrameProps & {
    gap?: SpacingValues;
    bulletGap?: SpacingValues;
    titleGap?: SpacingValues;
    isOrdered?: boolean;
    bulletSize?: BulletSize;
    children: React.ReactNode;
    'data-testid'?: string;
};

type BulletListContextValue = {
    itemGap: SpacingValues;
    titleGap: SpacingValues;
    bulletGap: SpacingValues;
    bulletSize: BulletSize;
    isOrdered: boolean;
};

const BulletListContext = createContext<BulletListContextValue>({
    itemGap: spacings.xxl,
    titleGap: spacings.xs,
    bulletGap: spacings.xl,
    bulletSize: 'large',
    isOrdered: false,
});

export const BulletList = ({
    gap = spacings.xxl,
    bulletGap = spacings.xl,
    titleGap = spacings.xs,
    isOrdered = false,
    bulletSize = 'large',
    'data-testid': dataTestId,
    children,
    ...rest
}: BulletListProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedBulletListFrameProps);

    return (
        <BulletListContext.Provider
            value={{ itemGap: gap, bulletGap, titleGap, isOrdered, bulletSize }}
        >
            <Container data-testid={dataTestId} {...frameProps}>
                {children}
            </Container>
        </BulletListContext.Provider>
    );
};

export const useBulletList = () => useContext(BulletListContext);

BulletList.Item = BulletListItem;
