import { createContext, useContext } from 'react';

import { spacings, SpacingValues } from '@trezor/theme';
import styled from 'styled-components';
import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import {
    TextPropsKeys,
    withTextProps,
    TextProps,
    pickAndPrepareTextProps,
} from '../typography/utils';
import { makePropsTransient, TransientProps } from '../../utils/transientProps';
import { uiVerticalAlignments } from '../../config/types';
import { ListItem } from './ListItem';

export const allowedListFrameProps = [
    'margin',
    'width',
    'overflow',
] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedListFrameProps)[number]>;

export const allowedListTextProps = [
    'typographyStyle',
    'textWrap',
] as const satisfies TextPropsKeys[];
type AllowedTextProps = Pick<TextProps, (typeof allowedListTextProps)[number]>;

export const bulletVerticalAlignments = uiVerticalAlignments;
export type BulletVerticalAlignment = (typeof uiVerticalAlignments)[number];

type ContainerProps = TransientProps<AllowedFrameProps> &
    TransientProps<AllowedTextProps> & {
        $gap: SpacingValues;
    };

const Container = styled.ul<ContainerProps>`
    display: flex;
    list-style-type: none;
    flex-direction: column;
    align-items: stretch;
    gap: ${({ $gap }) => $gap}px;

    ${withFrameProps}
    ${withTextProps}
`;

export type ListProps = AllowedFrameProps &
    AllowedTextProps & {
        gap?: SpacingValues;
        children: React.ReactNode;
        isOrdered?: boolean;
        bulletComponent?: React.ReactNode;
        bulletGap?: SpacingValues;
        bulletAlignment?: BulletVerticalAlignment;
    };

type ListContextValue = {
    bulletGap: SpacingValues;
    bulletAlignment: BulletVerticalAlignment;
    bulletComponent: React.ReactNode;
};

const ListContext = createContext<ListContextValue>({
    bulletGap: spacings.md,
    bulletAlignment: 'center',
    bulletComponent: null as React.ReactNode,
});

export const List = ({
    gap = spacings.xs,
    isOrdered,
    bulletGap = spacings.md,
    bulletAlignment = 'center',
    bulletComponent,
    children,
    ...rest
}: ListProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedListFrameProps);
    const textProps = pickAndPrepareTextProps(rest, allowedListTextProps);
    const elemType = isOrdered ? 'ol' : 'ul';

    return (
        <ListContext.Provider value={{ bulletGap, bulletAlignment, bulletComponent }}>
            <Container
                as={elemType}
                {...makePropsTransient({ gap })}
                {...frameProps}
                {...textProps}
            >
                {children}
            </Container>
        </ListContext.Provider>
    );
};

export const useList = () => useContext(ListContext);

List.Item = ListItem;
