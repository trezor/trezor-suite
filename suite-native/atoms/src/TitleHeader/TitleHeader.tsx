import { ReactNode } from 'react';

import { NativeSpacing, NativeTypographyStyle } from '@trezor/theme';

import { VStack } from '../Stack';
import { Text } from '../Text';

export type TitleHeaderProps = {
    title?: ReactNode;
    titleVariant?: NativeTypographyStyle;
    subtitle?: ReactNode;
    textAlign?: 'left' | 'center';
    titleSpacing?: NativeSpacing;
};

export const TitleHeader = ({
    title,
    subtitle,
    titleVariant = 'titleSmall',
    textAlign = 'left',
    titleSpacing = 'sp8',
}: TitleHeaderProps) => (
    <VStack spacing={titleSpacing} alignItems={textAlign === 'center' ? 'center' : 'flex-start'}>
        {title && (
            <Text variant={titleVariant} textAlign={textAlign}>
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
