import { Pressable } from 'react-native';

import { getCountryFlag } from '@suite-common/flags';
import { type TradingCountryOption } from '@suite-common/trading';
import { Box, Flag, HStack, Text } from '@suite-native/atoms';

export type CountryListItemProps = {
    isSelected: boolean;
    onPress: () => void;
} & TradingCountryOption;

export const CountryListItem = ({ name, onPress, value }: CountryListItemProps) => {
    const countryFlag = getCountryFlag(value);

    return (
        <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={name}>
            <HStack
                alignItems="center"
                spacing="sp12"
                paddingVertical="sp20"
                paddingHorizontal="sp6"
            >
                <Box flex={0}>{countryFlag && <Flag country={countryFlag} size={20} />}</Box>
                <Box flex={1}>
                    <Text variant="body-md" color="contentPrimary">
                        {name}
                    </Text>
                </Box>
            </HStack>
        </Pressable>
    );
};
