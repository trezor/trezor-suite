import { type ReactNode } from 'react';

import { type NativeSpacing, type NativeTypographyStyle } from '@trezor/theme';

import { VStack } from '../Stack';
import { Text, type TextProps } from '../Text';

export type TitleHeaderProps = {
    title?: ReactNode;
    titleVariant?: NativeTypographyStyle;
    subtitle?: ReactNode;
    textAlign?: 'left' | 'center';
    titleSpacing?: NativeSpacing;
    subtitleVariant?: NativeTypographyStyle;
} & TextProps;

export const TitleHeader = ({
    title,
    subtitle,
    titleVariant = 'headline-sm',
    textAlign = 'left',
    titleSpacing = 'sp8',
    subtitleVariant = 'body-md',
    ...textProps
}: TitleHeaderProps) => (
    <VStack spacing={titleSpacing} alignItems={textAlign === 'center' ? 'center' : 'flex-start'}>
        {title && (
            <Text {...textProps} variant={titleVariant} textAlign={textAlign}>
                {title}
            </Text>
        )}
        {subtitle && (
            <Text color="textSubdued" variant={subtitleVariant} textAlign={textAlign}>
                {subtitle}
            </Text>
        )}
    </VStack>
);
