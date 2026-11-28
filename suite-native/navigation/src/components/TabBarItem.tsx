import { View } from 'react-native';

import { PressableOpacity, TITLE_MAX_FONT_MULTIPLIER, Text } from '@suite-native/atoms';
import { Icon, type IconName } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type TabBarItemProps = {
    isFocused: boolean;
    onPress: () => void;
    iconName: IconName;
    focusedIconName: IconName;
    title?: string;
    testID: string;
};

const tabBarItemStyle = prepareNativeStyle(utils => ({
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: utils.spacings.sp8,
    gap: utils.spacings.sp2,
}));

type TabBarItemIconStyleProps = Pick<TabBarItemProps, 'isFocused'>;

const tabBarItemIconStyle = prepareNativeStyle<TabBarItemIconStyleProps>(
    (utils, { isFocused }) => ({
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: isFocused ? utils.spacings.sp12 : 0,
        paddingVertical: utils.spacings.sp4,
        borderRadius: utils.borders.radii.round,
        backgroundColor: isFocused ? utils.colors.elementFillBrandSofter : 'transparent',
    }),
);

export const TabBarItem = ({
    isFocused,
    onPress,
    iconName,
    focusedIconName,
    title,
    testID,
}: TabBarItemProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <PressableOpacity
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={() => {
                /*
             Calling in a function prevents Animation warning in iOS simulator
             see https://github.com/react-navigation/react-navigation/issues/7839#issuecomment-829438793
             */
                onPress();
            }}
            style={applyStyle(tabBarItemStyle)}
            testID={`@tabBar/${testID}`}
        >
            <View style={applyStyle(tabBarItemIconStyle, { isFocused })}>
                <Icon
                    name={isFocused ? focusedIconName : iconName}
                    size="large"
                    color={isFocused ? 'contentBrand' : 'contentSecondary'}
                />
            </View>
            {title && (
                <Text
                    maxFontSizeMultiplier={TITLE_MAX_FONT_MULTIPLIER}
                    variant={isFocused ? 'body-xs-strong' : 'body-xs'}
                    textAlign="center"
                    color={isFocused ? 'contentBrand' : 'contentSecondary'}
                    numberOfLines={1}
                    testID={`@tabBar/${testID}/title`}
                >
                    {title}
                </Text>
            )}
        </PressableOpacity>
    );
};
