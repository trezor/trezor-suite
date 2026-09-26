import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, HStack, Host, Text, VStack } from '@expo/ui/swift-ui';
import {
    accessibilityAddTraits,
    accessibilityHidden,
    accessibilityIdentifier,
    accessibilityLabel,
    buttonStyle,
    contentShape,
    font,
    foregroundStyle,
    frame,
    lineLimit,
    minimumScaleFactor,
    shapes,
} from '@expo/ui/swift-ui/modifiers';

import { MOBILE_ICON_FONT_NAME, icons } from '@suite-native/icons';
import { isDarkColor, prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { type TabBarProps, useTabBarItems } from './useTabBarItems';

const tabBarStyle = prepareNativeStyle<{
    insetLeft: number;
    insetRight: number;
    insetBottom: number;
}>((utils, { insetLeft, insetRight, insetBottom }) => ({
    width: '100%',
    backgroundColor: utils.colors.surfaceFillPage,
    borderTopColor: utils.colors.borderNeutral,
    borderTopWidth: utils.borders.widths.small,
    paddingLeft: insetLeft,
    paddingRight: insetRight,
    paddingBottom: insetBottom,
}));

export const TabBar = (props: TabBarProps) => {
    const items = useTabBarItems(props);
    const {
        applyStyle,
        utils: { colors },
    } = useNativeStyles();
    const insets = useSafeAreaInsets();
    const colorScheme = isDarkColor(colors.surfaceFillPage) ? 'dark' : 'light';

    return (
        <View
            style={applyStyle(tabBarStyle, {
                insetLeft: insets.left,
                insetRight: insets.right,
                insetBottom: insets.bottom,
            })}
            testID="@tabBar"
        >
            <Host
                colorScheme={colorScheme}
                matchContents={{ vertical: true }}
                style={{ width: '100%' }}
            >
                <HStack spacing={0} modifiers={[frame({ maxWidth: Infinity })]}>
                    {items.map(item => {
                        const iconColor = item.isFocused
                            ? colors.contentBrand
                            : colors.contentNeutral;
                        const iconName = item.isFocused ? item.focusedIconName : item.iconName;

                        return (
                            <Button
                                key={item.key}
                                onPress={item.onPress}
                                modifiers={[
                                    buttonStyle('plain'),
                                    frame({ maxWidth: Infinity }),
                                    accessibilityIdentifier(`@tabBar/${item.testID}`),
                                    accessibilityLabel(item.title),
                                    ...(item.isFocused
                                        ? [accessibilityAddTraits(['isSelected'])]
                                        : []),
                                ]}
                            >
                                <VStack
                                    spacing={2}
                                    modifiers={[
                                        frame({ minHeight: 50, maxWidth: Infinity }),
                                        contentShape(shapes.rectangle()),
                                    ]}
                                >
                                    <Text
                                        modifiers={[
                                            font({ family: MOBILE_ICON_FONT_NAME, size: 24 }),
                                            foregroundStyle(iconColor),
                                            frame({ width: 24, height: 24 }),
                                            accessibilityHidden(),
                                        ]}
                                    >
                                        {String.fromCodePoint(icons[iconName])}
                                    </Text>
                                    <Text
                                        modifiers={[
                                            font({ textStyle: 'caption2', weight: 'medium' }),
                                            foregroundStyle(iconColor),
                                            lineLimit(1),
                                            minimumScaleFactor(0.8),
                                        ]}
                                    >
                                        {item.title}
                                    </Text>
                                </VStack>
                            </Button>
                        );
                    })}
                </HStack>
            </Host>
        </View>
    );
};
