import { Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
    BottomTabBarHeightCallbackContext,
    type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';

import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { TabBar } from './TabBar';
import { AppTabsRoutes } from '../routes';
import { type TabsOptions } from '../types';

const tabItemOptions: TabsOptions = {
    [AppTabsRoutes.HomeStack]: {
        routeName: AppTabsRoutes.HomeStack,
        iconName: 'house',
        focusedIconName: 'houseFilled',
    },
    [AppTabsRoutes.Settings]: {
        routeName: AppTabsRoutes.Settings,
        iconName: 'gear',
        focusedIconName: 'gearFilled',
        params: { source: 'tab' },
    },
};

// The Earn route is registered in the navigator but has no tab options, e.g. on BTC-only firmware.
const routes = [AppTabsRoutes.HomeStack, AppTabsRoutes.EarnStack, AppTabsRoutes.Settings].map(
    name => ({ key: `${name}-key`, name }),
);

type RenderTabBarParams = {
    focusedIndex?: number;
    isTabPressPrevented?: boolean;
    onHeightChange?: (height: number) => void;
};

const renderTabBar = async ({
    focusedIndex = 0,
    isTabPressPrevented = false,
    onHeightChange = jest.fn(),
}: RenderTabBarParams = {}) => {
    const navigation = {
        emit: jest.fn(() => ({ defaultPrevented: isTabPressPrevented })),
        navigate: jest.fn(),
    };
    const props = {
        state: { index: focusedIndex, routes },
        navigation,
    } as unknown as BottomTabBarProps;

    const renderResult = await renderWithBasicProvider(
        <BottomTabBarHeightCallbackContext.Provider value={onHeightChange}>
            <TabBar {...props} tabItemOptions={tabItemOptions} />
        </BottomTabBarHeightCallbackContext.Provider>,
    );

    return { ...renderResult, navigation };
};

describe('TabBar', () => {
    const originalPlatformOS = Platform.OS;

    beforeEach(() => {
        jest.mocked(useSafeAreaInsets).mockReturnValue({ top: 0, left: 0, right: 0, bottom: 0 });
    });

    afterEach(() => {
        Platform.OS = originalPlatformOS;
    });

    it('renders only routes that have tab options', async () => {
        const { queryByTestId } = await renderTabBar();

        expect(queryByTestId(`@tabBar/${AppTabsRoutes.HomeStack}`)).toBeOnTheScreen();
        expect(queryByTestId(`@tabBar/${AppTabsRoutes.Settings}`)).toBeOnTheScreen();
        expect(queryByTestId(`@tabBar/${AppTabsRoutes.EarnStack}`)).not.toBeOnTheScreen();
    });

    it('marks the focused tab as selected', async () => {
        const { getByTestId } = await renderTabBar({ focusedIndex: 2 });

        expect(getByTestId(`@tabBar/${AppTabsRoutes.Settings}`)).toBeSelected();
        expect(getByTestId(`@tabBar/${AppTabsRoutes.HomeStack}`)).not.toBeSelected();
    });

    it('navigates to an unfocused tab with its params', async () => {
        const { getByTestId, navigation } = await renderTabBar();

        await fireEvent.press(getByTestId(`@tabBar/${AppTabsRoutes.Settings}`));

        expect(navigation.emit).toHaveBeenCalledWith({
            type: 'tabPress',
            target: `${AppTabsRoutes.Settings}-key`,
            canPreventDefault: true,
        });
        expect(navigation.navigate).toHaveBeenCalledWith(AppTabsRoutes.Settings, {
            source: 'tab',
        });
    });

    it('does not navigate when pressing the focused tab', async () => {
        const { getByTestId, navigation } = await renderTabBar();

        await fireEvent.press(getByTestId(`@tabBar/${AppTabsRoutes.HomeStack}`));

        expect(navigation.emit).toHaveBeenCalled();
        expect(navigation.navigate).not.toHaveBeenCalled();
    });

    it('does not navigate when the tab press is prevented', async () => {
        const { getByTestId, navigation } = await renderTabBar({ isTabPressPrevented: true });

        await fireEvent.press(getByTestId(`@tabBar/${AppTabsRoutes.Settings}`));

        expect(navigation.navigate).not.toHaveBeenCalled();
    });

    it('reports its height so screens can pad content under the floating bar', async () => {
        const onHeightChange = jest.fn();
        const { getByTestId } = await renderTabBar({ onHeightChange });

        await fireEvent(getByTestId('@tabBar'), 'layout', {
            nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 84 } },
        });

        expect(onHeightChange).toHaveBeenCalledWith(84);
    });

    it('sits within the home indicator area on iOS', async () => {
        Platform.OS = 'ios';
        jest.mocked(useSafeAreaInsets).mockReturnValue({ top: 0, left: 0, right: 0, bottom: 34 });
        const { getByTestId } = await renderTabBar();

        expect(StyleSheet.flatten(getByTestId('@tabBar').props.style).paddingBottom).toBe(22);
    });

    it('keeps clear of the system navigation bar on Android', async () => {
        Platform.OS = 'android';
        jest.mocked(useSafeAreaInsets).mockReturnValue({ top: 0, left: 0, right: 0, bottom: 48 });
        const { getByTestId } = await renderTabBar();

        expect(StyleSheet.flatten(getByTestId('@tabBar').props.style).paddingBottom).toBe(48);
    });
});
