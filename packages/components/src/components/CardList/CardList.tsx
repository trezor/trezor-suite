import { CardListItem } from './CardListItem';
import { type FrameProps, type FramePropsKeys } from '../../utils/frameProps';
import { Card, type CardProps } from '../Card/Card';
import { Column } from '../Flex/Flex';
import { Text } from '../typography/Text/Text';
import type { TextPropsKeys, TextProps as TextStyleProps } from '../typography/utils';

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

export const CardList = ({ children, typographyStyle = 'body-md', ...rest }: CardListProps) => (
    <Card paddingType="none" {...rest}>
        <Text typographyStyle={typographyStyle} as="div" width="100%">
            <Column gap={0} hasDivider>
                {children}
            </Column>
        </Text>
    </Card>
);

CardList.Item = CardListItem;
