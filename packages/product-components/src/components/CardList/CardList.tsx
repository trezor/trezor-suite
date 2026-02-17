import {
    Card,
    type CardProps,
    Column,
    FrameProps,
    FramePropsKeys,
    Text,
    type TextPropsKeys,
    type TextStyleProps,
} from '@trezor/components';

import { CardListItem } from './CardListItem';

export const allowedCardListFrameProps = [
    'margin',
    'width',
    'maxWidth',
    'minWidth',
    'height',
    'minHeight',
    'maxHeight',
    'position',
    'flex',
    'zIndex',
] as const satisfies FramePropsKeys[];
export type AllowedCardListFrameProps = Pick<
    FrameProps,
    (typeof allowedCardListFrameProps)[number]
>;

export const allowedCardListTextProps = ['typographyStyle'] as const satisfies TextPropsKeys[];
export type AllowedCardListTextProps = Pick<
    TextStyleProps,
    (typeof allowedCardListTextProps)[number]
>;

export type CardListProps = AllowedCardListFrameProps &
    AllowedCardListTextProps &
    Omit<
        CardProps,
        | 'paddingType'
        | 'overflow'
        | 'header'
        | 'footer'
        | 'label'
        | 'onClick'
        | 'className'
        | 'tabIndex'
        | 'variant'
        | 'fillType'
    >;

export const CardList = ({ children, typographyStyle = 'body', ...rest }: CardListProps) => (
    <Card paddingType="none" {...rest}>
        <Text typographyStyle={typographyStyle} as="div" width="100%">
            <Column gap={0} hasDivider>
                {children}
            </Column>
        </Text>
    </Card>
);

CardList.Item = CardListItem;
