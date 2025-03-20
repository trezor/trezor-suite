import { createContext, useContext } from 'react';

import styled from 'styled-components';

import { SpacingValues, spacings } from '@trezor/theme';

import { ListItem } from './ListItem';
import { uiAlignments } from '../../config/types';
import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { TransientProps, makePropsTransient } from '../../utils/transientProps';
import { Text, textVariants } from '../typography/Text/Text';
import {
    TextProps,
    TextPropsKeys,
    pickAndPrepareTextProps,
    withTextProps,
} from '../typography/utils';

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

export const listVariants = textVariants;
export type ListVariant = (typeof listVariants)[number];

export const bulletVerticalAlignments = uiAlignments;
export type BulletVerticalAlignment = (typeof bulletVerticalAlignments)[number];

type ContainerProps = TransientProps<AllowedFrameProps & AllowedTextProps> & {
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
        bulletComponent?: React.ReactNode;
        bulletGap?: SpacingValues;
        bulletAlignment?: BulletVerticalAlignment;
        variant?: ListVariant;
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
    bulletGap = spacings.md,
    bulletAlignment = 'center',
    bulletComponent,
    variant,
    children,
    ...rest
}: ListProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedListFrameProps);
    const textProps = pickAndPrepareTextProps(rest, allowedListTextProps);

    return (
        <ListContext.Provider value={{ bulletGap, bulletAlignment, bulletComponent }}>
            <Text as="div" variant={variant}>
                <Container {...makePropsTransient({ gap })} {...frameProps} {...textProps}>
                    {children}
                </Container>
            </Text>
        </ListContext.Provider>
    );
};

export const useList = () => useContext(ListContext);

List.Item = ListItem;
