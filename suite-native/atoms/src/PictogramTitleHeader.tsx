import { ReactNode } from 'react';

import { IconName } from '@suite-common/icons';
import { TypographyStyle } from '@trezor/theme';

import { Box } from './Box';
import { Text } from './Text';
import { VStack } from './Stack';
import { PictogramVariant, PictogramSize, Pictogram } from './Pictogram';

type PictogramTitleHeaderProps = {
    variant: PictogramVariant;
    icon: IconName;
    size?: PictogramSize;
    title?: ReactNode;
    titleVariant?: TypographyStyle;
    subtitle?: ReactNode;
};

export const PictogramTitleHeader = ({
    variant,
    icon,
    title,
    subtitle,
    titleVariant = 'titleSmall',
    size = 'large',
}: PictogramTitleHeaderProps) => {
    return (
        <VStack alignItems="center" spacing="large">
            <Pictogram variant={variant} icon={icon} size={size} />
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
        </VStack>
    );
};
