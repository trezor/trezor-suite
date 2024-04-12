import { ReactNode } from 'react';

import { TypographyStyle } from '@trezor/theme';

import { Box } from './Box';
import { Text } from './Text';
import { VStack } from './Stack';

type CenteredTitleHeaderProps = {
    title?: ReactNode;
    titleVariant?: TypographyStyle;
    subtitle?: ReactNode;
};

export const CenteredTitleHeader = ({
    title,
    subtitle,
    titleVariant = 'titleSmall',
}: CenteredTitleHeaderProps) => {
    return (
        <VStack alignItems="center">
            {title && (
                <Box>
                    <Text variant={titleVariant} textAlign="center">
                        {title}
                    </Text>
                </Box>
            )}
            {subtitle && (
                <Text color="textSubdued" textAlign="center">
                    {subtitle}
                </Text>
            )}
        </VStack>
    );
};
