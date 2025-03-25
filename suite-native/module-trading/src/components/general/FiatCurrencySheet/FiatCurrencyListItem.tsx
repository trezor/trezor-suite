import { Pressable } from 'react-native';

import { Box, HStack, Text, VStack } from '@suite-native/atoms';

import { FiatCurrencyIcon } from '../FiatCurrencyIcon';

export type FiatCurrencyListItemProps = {
    displayValue: string;
    label: string;
    onPress: () => void;
};

export const FIAT_CURRENCY_LIST_ITEM_HEIGHT = 68 as const;

export const FiatCurrencyListItem = ({
    displayValue,
    onPress,
    label,
}: FiatCurrencyListItemProps) => (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
        <HStack alignItems="center" spacing="sp12" paddingVertical="sp12" justifyContent="center">
            <Box justifyContent="center">
                <FiatCurrencyIcon />
            </Box>
            <VStack flex={1} spacing={0}>
                <Text variant="body" color="textDefault">
                    {label}
                </Text>
                <Text variant="body" color="textSubdued">
                    {displayValue}
                </Text>
            </VStack>
        </HStack>
    </Pressable>
);
