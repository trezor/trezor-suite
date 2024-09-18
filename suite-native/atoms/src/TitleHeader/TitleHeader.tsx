import { ReactNode } from 'react';

import { NativeSpacing, TypographyStyle } from '@trezor/theme';

import { Text } from '../Text';
import { VStack } from '../Stack';

export type TitleHeaderProps = {
    title?: ReactNode;
    titleVariant?: TypographyStyle;
    subtitle?: ReactNode;
    textAlign?: 'left' | 'center';
    titleSpacing?: NativeSpacing;
};

export const TitleHeader = ({
    title,
    subtitle,
    titleVariant = 'titleSmall',
    textAlign = 'left',
    titleSpacing = 'small',
}: TitleHeaderProps) => {
    return (
        <VStack
            spacing={titleSpacing}
            alignItems={textAlign === 'center' ? 'center' : 'flex-start'}
        >
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
};
