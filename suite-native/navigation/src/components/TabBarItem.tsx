import { TouchableOpacity, View } from 'react-native';

import { Icon, IconName } from '@suite-common/icons';
import { Text, TITLE_MAX_FONT_MULTIPLIER } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type TabBarItemProps = {
    isFocused: boolean;
    onPress: () => void;
    iconName: IconName;
    title?: string;
};

const tabBarItemStyle = prepareNativeStyle(_ => ({
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
}));

const tabBarItemContainerStyle = prepareNativeStyle(utils => ({
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: utils.spacings.small,
}));

const TAB_BAR_ITEM_HORIZONTAL_HIT_SLOP = 15;

export const TabBarItem = ({ isFocused, onPress, iconName, title }: TabBarItemProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <TouchableOpacity
            testID={`@bottomBar/${title}`}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={() => {
                /*
             Calling in a function prevents Animation warning in iOS simulator
             see https://github.com/react-navigation/react-navigation/issues/7839#issuecomment-829438793
             */
                onPress();
            }}
            hitSlop={{
                top: TAB_BAR_ITEM_HORIZONTAL_HIT_SLOP,
                bottom: TAB_BAR_ITEM_HORIZONTAL_HIT_SLOP,
            }}
            style={applyStyle(tabBarItemStyle)}
        >
            <View style={applyStyle(tabBarItemContainerStyle)}>
                <Icon
                    name={iconName}
                    size="large"
                    color={isFocused ? 'iconPrimaryDefault' : 'iconDisabled'}
                />
                {title && (
                    <Text
                        maxFontSizeMultiplier={TITLE_MAX_FONT_MULTIPLIER}
                        variant="label"
                        textAlign="center"
                        color={isFocused ? 'textPrimaryDefault' : 'textDisabled'}
                    >
                        {title}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );
};
