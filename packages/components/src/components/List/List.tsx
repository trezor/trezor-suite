import type { ReactNode } from 'react';

import styled from 'styled-components';

import type { SpacingValues } from '@trezor/theme';
import { spacings, spacingsPx } from '@trezor/theme';

import { ListContext } from './ListContext';
import { ListItem } from './ListItem';
import type { BulletVerticalAlignment, ListStyleType, ListVariant } from './types';
import type { FrameProps, FramePropsKeys } from '../../utils/frameProps';
import { pickAndPrepareFrameProps, withFrameProps } from '../../utils/frameProps';
import type { TransientProps } from '../../utils/transientProps';
import { makePropsTransient } from '../../utils/transientProps';
import { Text } from '../typography/Text/Text';
import type { TextProps, TextPropsKeys } from '../typography/utils';
import { pickAndPrepareTextProps, withTextProps } from '../typography/utils';

export const allowedListFrameProps = [
    'margin',
    'width',
    'overflow',
] as const satisfies FramePropsKeys[];
export type AllowedFrameProps = Pick<FrameProps, (typeof allowedListFrameProps)[number]>;

export const allowedListTextProps = [
    'typographyStyle',
    'textWrap',
] as const satisfies TextPropsKeys[];
export type AllowedTextProps = Pick<TextProps, (typeof allowedListTextProps)[number]>;

type ContainerProps = TransientProps<AllowedFrameProps & AllowedTextProps> & {
    $gap: SpacingValues;
    $listStyleType?: ListStyleType;
};

const Container = styled.ul<ContainerProps>`
    display: flex;
    list-style-type: ${({ $listStyleType }) => $listStyleType || 'none'};
    padding-left: ${({ $listStyleType }) => $listStyleType && spacingsPx.md};
    flex-direction: column;
    align-items: stretch;
    gap: ${({ $gap }) => $gap}px;

    ${withFrameProps}
    ${withTextProps}
`;

export type ListProps = AllowedFrameProps &
    AllowedTextProps & {
        gap?: SpacingValues;
        children: ReactNode;
        bulletComponent?: ReactNode;
        bulletGap?: SpacingValues;
        bulletAlignment?: BulletVerticalAlignment;
        variant?: ListVariant;
        listStyleType?: ListStyleType;
    };

export const List = ({
    gap = spacings.xs,
    bulletGap = spacings.md,
    bulletAlignment = 'center',
    bulletComponent,
    listStyleType,
    variant,
    children,
    ...rest
}: ListProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedListFrameProps);
    const textProps = pickAndPrepareTextProps(rest, allowedListTextProps);

    return (
        <ListContext.Provider
            value={{ bulletGap, bulletAlignment, bulletComponent, listStyleType }}
        >
            <Text as="div" variant={variant}>
                <Container
                    {...makePropsTransient({ gap, listStyleType })}
                    {...frameProps}
                    {...textProps}
                >
                    {children}
                </Container>
            </Text>
        </ListContext.Provider>
    );
};

List.Item = ListItem;
