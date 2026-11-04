import { useSafeAreaFrame } from 'react-native-safe-area-context';

import { type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Header, Screen, getHeaderTitle } from '@react-navigation/elements';

type NativeIOSTabSceneProps = {
    descriptor: BottomTabBarProps['descriptors'][string];
    isFocused: boolean;
};

export const NativeIOSTabScene = ({ descriptor, isFocused }: NativeIOSTabSceneProps) => {
    const layout = useSafeAreaFrame();
    const { options, route, navigation } = descriptor;
    const { headerShown, headerStatusBarHeight, headerTransparent, header, sceneStyle } = options;
    const headerElement = header ? (
        header({
            layout,
            options,
            route,
            navigation,
        })
    ) : (
        <Header {...options} layout={layout} title={getHeaderTitle(options, route.name)} />
    );

    return (
        <Screen
            focused={isFocused}
            route={route}
            navigation={navigation}
            headerShown={headerShown}
            headerStatusBarHeight={headerStatusBarHeight}
            headerTransparent={headerTransparent}
            header={headerElement}
            style={sceneStyle}
        >
            {descriptor.render()}
        </Screen>
    );
};
