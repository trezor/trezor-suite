import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RNHostView, TabView, ZStack } from '@expo/ui/swift-ui';
import { frame, onGeometryChange } from '@expo/ui/swift-ui/modifiers';
import { BottomTabBarHeightContext, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { SafeAreaProviderCompat } from '@react-navigation/elements';
import { type Route } from '@react-navigation/native';

import { NativeIOSTabScene } from './NativeIOSTabScene';
import { useNativeTabOptions } from './useNativeTabOptions';
import { type TabsOptions } from '../../types';

const styles = StyleSheet.create({ fill: { flex: 1 } });

type NativeIOSTabProps = {
    route: Route<string>;
    descriptor: BottomTabBarProps['descriptors'][string];
    isFocused: boolean;
    isLoaded: boolean;
    viewportBottom: number | undefined;
    tabItemOptions: TabsOptions;
};

export const NativeIOSTab = ({
    route,
    descriptor,
    isFocused,
    isLoaded,
    viewportBottom,
    tabItemOptions,
}: NativeIOSTabProps) => {
    const [sceneBottom, setSceneBottom] = useState<number>();
    const { label, testID, systemImage } = useNativeTabOptions({
        route,
        options: descriptor.options,
        tabItemOptions,
    });
    const isSceneRendered = descriptor.options.lazy === false || isLoaded;
    const tabBarHeight =
        viewportBottom !== undefined && sceneBottom !== undefined
            ? Math.max(0, viewportBottom - sceneBottom)
            : 0;

    return (
        <TabView.Tab value={route.key} label={label} systemImage={systemImage} testID={testID}>
            <ZStack
                modifiers={[
                    frame({ maxWidth: Infinity, maxHeight: Infinity }),
                    onGeometryChange(geometry => setSceneBottom(geometry.y + geometry.height)),
                ]}
            >
                {isSceneRendered && (
                    <RNHostView>
                        <View style={styles.fill} collapsable={false}>
                            {/* Each SwiftUI page has its own viewport and must measure its own insets. */}
                            <SafeAreaProvider style={styles.fill}>
                                <SafeAreaProviderCompat>
                                    <BottomTabBarHeightContext.Provider value={tabBarHeight}>
                                        <NativeIOSTabScene
                                            descriptor={descriptor}
                                            isFocused={isFocused}
                                        />
                                    </BottomTabBarHeightContext.Provider>
                                </SafeAreaProviderCompat>
                            </SafeAreaProvider>
                        </View>
                    </RNHostView>
                )}
            </ZStack>
        </TabView.Tab>
    );
};
