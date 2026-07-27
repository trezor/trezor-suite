import { Pressable } from 'react-native';

import { type TradingCountrySubdivisionOption } from '@suite-common/trading';
import { HStack, Text } from '@suite-native/atoms';

export type CountrySubdivisionListItemProps = {
    onPress: () => void;
} & TradingCountrySubdivisionOption;

export const CountrySubdivisionListItem = ({ name, onPress }: CountrySubdivisionListItemProps) => (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={name}>
        <HStack alignItems="center" spacing="sp12" paddingVertical="sp20" paddingHorizontal="sp6">
            <Text variant="body-md" color="contentPrimary">
                {name}
            </Text>
        </HStack>
    </Pressable>
);
