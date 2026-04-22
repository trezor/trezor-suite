import { Platform, Pressable } from 'react-native';
import { FadeIn, FadeOut } from 'react-native-reanimated';

import { type TradingCountryOption } from '@suite-common/trading';
import { AnimatedBox, Box, Card, HStack, Radio, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

export type CountryListItemProps = {
    isSelected: boolean;
    onPress: () => void;
} & TradingCountryOption;

const wrapperStyle = prepareNativeStyle(({ spacings }) => ({
    marginVertical: spacings.sp4,
}));

const flagStyle = prepareNativeStyle(() => ({
    fontSize: 20,
    lineHeight: 24,
}));

export const CountryListItem = ({
    name,
    flag,
    onPress,
    value,
    isSelected,
}: CountryListItemProps) => {
    const { applyStyle } = useNativeStyles();
    // on android fade animation looks ugly on view with shadows, but without animation it looks even worse
    // do not display shadow on android and keep animating
    const noShadow = Platform.OS === 'android';

    return (
        <AnimatedBox entering={FadeIn} exiting={FadeOut}>
            <Pressable onPress={onPress} style={applyStyle(wrapperStyle)}>
                <Card noShadow={noShadow}>
                    <HStack alignItems="center" justifyContent="space-between">
                        <Box flex={0}>
                            <Text
                                variant="body-md"
                                color="contentPrimary"
                                style={applyStyle(flagStyle)}
                            >
                                {flag}
                            </Text>
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
