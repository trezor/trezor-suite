import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { TabBarItem } from './TabBarItem';
import { type TabBarProps, useTabBarItems } from './useTabBarItems';

const tabBarStyle = prepareNativeStyle<{
    insetLeft: number;
    insetRight: number;
    insetsBottom: number;
}>((utils, { insetLeft, insetRight, insetsBottom }) => ({
    width: '100%',
    backgroundColor: utils.colors.surfaceFillPage,
    borderTopColor: utils.colors.borderNeutral,
    borderTopWidth: utils.borders.widths.small,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingLeft: Math.max(insetLeft, 20),
    paddingRight: Math.max(insetRight, 20),
    paddingBottom: insetsBottom,
}));

export const TabBar = (props: TabBarProps) => {
    const items = useTabBarItems(props);
    const { applyStyle } = useNativeStyles();
    const insets = useSafeAreaInsets();

    return (
        <Box
            style={applyStyle(tabBarStyle, {
                insetLeft: insets.left,
                insetRight: insets.right,
                insetsBottom: insets.bottom,
            })}
        >
            {items.map(item => (
                <TabBarItem
                    key={item.key}
                    isFocused={item.isFocused}
                    iconName={item.iconName}
                    focusedIconName={item.focusedIconName}
                    title={item.title}
                    onPress={item.onPress}
                    testID={item.testID}
                />
            ))}
        </Box>
    );
};
