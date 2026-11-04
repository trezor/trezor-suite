import { useContext } from 'react';
import { View } from 'react-native';

import { Host, NavigationBar } from '@expo/ui/jetpack-compose';
import { fillMaxWidth } from '@expo/ui/jetpack-compose/modifiers';
import {
    BottomTabBarHeightCallbackContext,
    type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { useTheme } from '@react-navigation/native';

import { useNativeStyles } from '@trezor/styles-native';

import { NativeAndroidTabBarItem } from './NativeAndroidTabBarItem';
import { type TabsOptions } from '../../types';

type NativeAndroidTabBarProps = BottomTabBarProps & {
    tabItemOptions: TabsOptions;
};

export const NativeAndroidTabBar = ({ tabItemOptions, ...props }: NativeAndroidTabBarProps) => {
    const onHeightChange = useContext(BottomTabBarHeightCallbackContext);
    const { dark } = useTheme();
    const {
        utils: { colors },
    } = useNativeStyles();

    return (
        <View onLayout={event => onHeightChange?.(event.nativeEvent.layout.height)}>
            <Host
                matchContents={{ vertical: true }}
                colorScheme={dark ? 'dark' : 'light'}
                seedColor={colors.contentBrand}
                ignoreSafeAreaKeyboardInsets
                style={{ width: '100%' }}
            >
                <NavigationBar modifiers={[fillMaxWidth()]}>
                    {props.state.routes.map((route, index) => {
                        const descriptor = props.descriptors[route.key];
                        if (!descriptor) return null;

                        return (
                            <NativeAndroidTabBarItem
                                key={route.key}
                                route={route}
                                isFocused={props.state.index === index}
                                state={props.state}
                                navigation={props.navigation}
                                options={descriptor.options}
                                tabItemOptions={tabItemOptions}
                            />
                        );
                    })}
                </NavigationBar>
            </Host>
        </View>
    );
};
