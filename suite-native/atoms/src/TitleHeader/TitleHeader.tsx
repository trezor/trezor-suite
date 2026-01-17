import { ReactNode } from 'react';

import { NativeSpacing, NativeTypographyStyle } from '@trezor/theme';

import { VStack } from '../Stack';
import { Text, TextProps } from '../Text';

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
    titleVariant = 'titleSmall',
    textAlign = 'left',
    titleSpacing = 'sp8',
    subtitleVariant = 'body',
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
