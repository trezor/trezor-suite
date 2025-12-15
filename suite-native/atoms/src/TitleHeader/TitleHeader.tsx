import type { ReactNode } from 'react';

import type { NativeSpacing, NativeTypographyStyle } from '@trezor/theme';

import { VStack } from '../Stack';
import type { TextProps } from '../Text';
import { Text } from '../Text';

export type TitleHeaderProps = {
    title?: ReactNode;
    titleVariant?: NativeTypographyStyle;
    subtitle?: ReactNode;
    textAlign?: 'left' | 'center';
    titleSpacing?: NativeSpacing;
} & TextProps;

export const TitleHeader = ({
    title,
    subtitle,
    titleVariant = 'titleSmall',
    textAlign = 'left',
    titleSpacing = 'sp8',
    ...textProps
}: TitleHeaderProps) => (
    <VStack spacing={titleSpacing} alignItems={textAlign === 'center' ? 'center' : 'flex-start'}>
        {title && (
            <Text {...textProps} variant={titleVariant} textAlign={textAlign}>
                {title}
            </Text>
        )}
        {subtitle && (
            <Text color="textSubdued" textAlign={textAlign}>
                {subtitle}
            </Text>
        )}
    </VStack>
);
