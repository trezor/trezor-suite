import { type ReactNode } from 'react';

import { Box, HStack, Text, VStack } from '@suite-native/atoms';
import { tokenIconSizes } from '@suite-native/icons';

type EarnRateBreakdownRowProps = {
    icon: ReactNode;
    symbol: ReactNode;
    description?: ReactNode;
    value?: ReactNode;
};

export const EarnRateBreakdownRow = ({
    icon,
    symbol,
    description,
    value,
}: EarnRateBreakdownRowProps) => (
    <VStack spacing={0}>
        <HStack justifyContent="space-between">
            <HStack alignItems="center">
                {icon}
                <Text variant="body-md">{symbol}</Text>
            </HStack>
            {value != null && (
                <Text variant="body-md" color="contentBrand">
                    {value}
                </Text>
            )}
        </HStack>
        {description != null && (
            <Box style={{ marginLeft: tokenIconSizes.extraSmall }} paddingLeft="sp8">
                <Text variant="body-sm" color="contentSecondary">
                    {description}
                </Text>
            </Box>
        )}
    </VStack>
);
