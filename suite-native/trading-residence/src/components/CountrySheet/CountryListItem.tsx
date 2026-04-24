import { Platform, Pressable } from 'react-native';
import { FadeIn, FadeOut } from 'react-native-reanimated';

import { getCountryFlag } from '@suite-common/flags';
import { type TradingCountryOption } from '@suite-common/trading';
import { AnimatedBox, Box, Card, Flag, HStack, Radio, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

export type CountryListItemProps = {
    isSelected: boolean;
    onPress: () => void;
} & TradingCountryOption;

const wrapperStyle = prepareNativeStyle(({ spacings }) => ({
    marginVertical: spacings.sp4,
}));

export const CountryListItem = ({ name, onPress, value, isSelected }: CountryListItemProps) => {
    const { applyStyle } = useNativeStyles();
    const countryFlag = getCountryFlag(value);
    // on android fade animation looks ugly on view with shadows, but without animation it looks even worse
    // do not display shadow on android and keep animating
    const noShadow = Platform.OS === 'android';

    return (
        <AnimatedBox entering={FadeIn} exiting={FadeOut}>
            <Pressable onPress={onPress} style={applyStyle(wrapperStyle)}>
                <Card noShadow={noShadow}>
                    <HStack alignItems="center" justifyContent="space-between">
                        <Box flex={0}>
                            {countryFlag && <Flag country={countryFlag} size={20} />}
                        </Box>
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
