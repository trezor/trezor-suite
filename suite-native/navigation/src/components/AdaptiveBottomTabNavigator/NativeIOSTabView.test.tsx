import { useEffect, useState } from 'react';
import { Pressable, Text } from 'react-native';

import { TabView, type TabViewProps } from '@expo/ui/swift-ui';
import { type BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { type EventArg, type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { act, fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';
import { mock } from '@trezor/dependency-injection';

import { createAdaptiveBottomTabNavigator } from '../../createAdaptiveBottomTabNavigator';

jest.mock('./AdaptiveBottomTabView', () => jest.requireActual('./AdaptiveBottomTabView.ios'));
jest.mock('@expo/ui/swift-ui', () => {
    const { View } = require('react-native');

    return {
        Host: View,
        RNHostView: View,
        ZStack: View,
        TabView: Object.assign(
            jest.fn(({ children, selection }: TabViewProps) => (
                <View testID="native-tabs" accessibilityLabel={selection}>
                    {children}
                </View>
            )),
            { Tab: View },
        ),
    };
});

type TestParamList = { Home: undefined; Accounts: undefined; Settings: undefined };
type TabPressListener = (event: EventArg<'tabPress', true>) => void;

const Tab = createAdaptiveBottomTabNavigator<TestParamList>();
const tabItemOptions = {};
let mockNavigation: BottomTabNavigationProp<TestParamList>;

const StatefulScene = () => {
    const navigation = useNavigation<BottomTabNavigationProp<TestParamList>>();
    const route = useRoute<RouteProp<TestParamList>>();
    const [count, setCount] = useState(0);

    useEffect(() => {
        mockNavigation = navigation;
    }, [navigation]);

    return (
        <Pressable onPress={() => setCount(value => value + 1)}>
            <Text testID={`scene-${route.name}`}>{count}</Text>
        </Pressable>
    );
};

const renderTabs = (onAccountsPress?: TabPressListener) =>
    renderWithBasicProvider(
        <Tab.Navigator
            isNativeNavigationEnabled
            tabItemOptions={tabItemOptions}
            initialRouteName="Home"
            screenOptions={{ headerShown: false }}
        >
            <Tab.Screen name="Home" component={StatefulScene} />
            <Tab.Screen
                name="Accounts"
                component={StatefulScene}
                listeners={{ tabPress: onAccountsPress }}
            />
            <Tab.Screen name="Settings" component={StatefulScene} />
        </Tab.Navigator>,
    );

describe('NativeIOSTabView lifecycle', () => {
    it('loads scenes lazily, retains preloaded and visited state, and follows programmatic selection', async () => {
        const { getByTestId, queryByTestId } = await renderTabs();
        expect(queryByTestId('scene-Accounts', { includeHiddenElements: true })).toBeNull();
        expect(queryByTestId('scene-Settings', { includeHiddenElements: true })).toBeNull();
        await fireEvent.press(getByTestId('scene-Home'));

        await act(() => mockNavigation.preload('Accounts'));
        expect(getByTestId('scene-Accounts', { includeHiddenElements: true })).toHaveTextContent(
            '0',
        );
        expect(queryByTestId('scene-Settings', { includeHiddenElements: true })).toBeNull();

        await act(() => mockNavigation.navigate('Accounts'));
        const accountKey = mockNavigation.getState().routes[1]?.key;
        expect(getByTestId('native-tabs').props.accessibilityLabel).toBe(accountKey);
        await fireEvent.press(getByTestId('scene-Accounts'));

        await act(() => mockNavigation.navigate('Home'));
        const homeKey = mockNavigation.getState().routes[0]?.key;
        expect(getByTestId('native-tabs').props.accessibilityLabel).toBe(homeKey);
        expect(getByTestId('scene-Home')).toHaveTextContent('1');
        expect(getByTestId('scene-Accounts', { includeHiddenElements: true })).toHaveTextContent(
            '1',
        );

        await act(() => mockNavigation.navigate('Accounts'));
        expect(getByTestId('scene-Accounts')).toHaveTextContent('1');
    });

    it('keeps controlled selection and the lazy scene unchanged when a native selection is prevented', async () => {
        const preventTabPress = mock<TabPressListener>(event => event.preventDefault());
        const { getByTestId, queryByTestId } = await renderTabs(preventTabPress);
        const { routes, index } = mockNavigation.getState();
        // Accounts is the second screen registered by this fixture.
        const accountKey = routes[1]!.key;

        await act(() =>
            jest.mocked(TabView).mock.calls.at(-1)?.[0].onSelectionChange?.(accountKey),
        );

        expect(preventTabPress).toHaveBeenCalledTimes(1);
        expect(mockNavigation.getState().index).toBe(index);
        expect(getByTestId('native-tabs').props.accessibilityLabel).toBe(routes[index]?.key);
        expect(queryByTestId('scene-Accounts', { includeHiddenElements: true })).toBeNull();
    });
});
