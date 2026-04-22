import { Pressable } from 'react-native';

import { Box, HStack, Text, VStack } from '@suite-native/atoms';

import { FiatCurrencyIcon } from '../FiatCurrencyIcon';

export type FiatCurrencyListItemProps = {
    displayValue: string;
    label: string;
    onPress: () => void;
};

export const FiatCurrencyListItem = ({
    displayValue,
    onPress,
    label,
}: FiatCurrencyListItemProps) => (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
        <HStack alignItems="center" spacing="sp12" paddingVertical="sp12" justifyContent="center">
            <Box justifyContent="center">
                <FiatCurrencyIcon size="medium" />
            </Box>
            <VStack flex={1} spacing={0}>
                <Text variant="body-md" color="contentPrimary">
                    {label}
                </Text>
                <Text variant="body-sm" color="contentSecondary">
                    {displayValue}
                </Text>
            </VStack>
        </HStack>
    </Pressable>
);
