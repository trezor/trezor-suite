import React from 'react';
import { TouchableOpacity, View } from 'react-native';

import { Icon, IconName } from '@trezor/icons';
import { Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

export type TabBarItemProps = {
    isFocused: boolean;
    onPress: () => void;
    iconName: IconName;
    title?: string;
    isActionTabItem?: boolean;
};

type TabBarItemStyleProps = { isActionTabItem: boolean };

const tabBarItemStyle = prepareNativeStyle<TabBarItemStyleProps>(_ => ({
    flex: 1,
    marginTop: 11,
    alignItems: 'center',
    justifyContent: 'center',
}));

const tabBarItemContainerStyle = prepareNativeStyle<TabBarItemStyleProps>(
    (utils, { isActionTabItem }) => ({
        justifyContent: 'center',
        alignItems: 'center',
        color: utils.colors.forest,
        extend: [
            {
                condition: isActionTabItem,
                style: {
                    color: utils.colors.gray0,
                    width: 40,
                    height: 40,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: utils.borders.radii.round,
                    backgroundColor: utils.colors.forest,
                },
            },
        ],
    }),
);

const TAB_BAR_ITEM_HORIZONTAL_HIT_SLOP = 15;

export const TabBarItem = ({
    isFocused,
    onPress,
    iconName,
    title,
    isActionTabItem = false,
}: TabBarItemProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <TouchableOpacity
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
            style={applyStyle(tabBarItemStyle, { isActionTabItem })}
        >
            <View style={applyStyle(tabBarItemContainerStyle, { isActionTabItem })}>
                <Icon name={iconName} size="large" color={isFocused ? 'forest' : 'gray500'} />
                {title && (
                    <Text variant="label" color={isFocused ? 'forest' : 'gray500'}>
                        {title}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );
};
