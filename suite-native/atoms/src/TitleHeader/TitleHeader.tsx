import { ReactNode } from 'react';

import { TypographyStyle } from '@trezor/theme';

import { Text } from '../Text';
import { VStack } from '../Stack';

export type TitleHeaderProps = {
    title?: ReactNode;
    titleVariant?: TypographyStyle;
    subtitle?: ReactNode;
    textAlign?: 'left' | 'center';
};

export const TitleHeader = ({
    title,
    subtitle,
    titleVariant = 'titleSmall',
    textAlign = 'left',
}: TitleHeaderProps) => {
    return (
        <VStack alignItems={textAlign === 'center' ? 'center' : 'flex-start'}>
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
