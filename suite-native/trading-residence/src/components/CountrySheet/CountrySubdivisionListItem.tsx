import { Platform, Pressable } from 'react-native';
import { FadeIn, FadeOut } from 'react-native-reanimated';

import { type TradingCountrySubdivisionOption } from '@suite-common/trading';
import { AnimatedBox, Box, Card, HStack, Radio, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

export type CountrySubdivisionListItemProps = {
    isSelected: boolean;
    onPress: () => void;
} & TradingCountrySubdivisionOption;

const wrapperStyle = prepareNativeStyle(({ spacings }) => ({
    marginVertical: spacings.sp4,
}));

export const CountrySubdivisionListItem = ({
    name,
    onPress,
    value,
    isSelected,
}: CountrySubdivisionListItemProps) => {
    const { applyStyle } = useNativeStyles();
    const noShadow = Platform.OS === 'android';

    return (
        <AnimatedBox entering={FadeIn} exiting={FadeOut}>
            <Pressable onPress={onPress} style={applyStyle(wrapperStyle)}>
                <Card noShadow={noShadow}>
                    <HStack alignItems="center" justifyContent="space-between">
                        <Box flex={1}>
                            <Text variant="body-md" color="contentPrimary">
                                {name}
                            </Text>
                        </Box>
                        <Box flex={0}>
                            <Radio value={value} onPress={onPress} isChecked={isSelected} />
                        </Box>
                    </HStack>
                </Card>
            </Pressable>
        </AnimatedBox>
    );
};
