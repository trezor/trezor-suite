import { type ParamListBase, type TabNavigationState } from '@react-navigation/native';

import { mock } from '@trezor/dependency-injection';

import { type NativeTabNavigation, selectNativeTab } from './nativeTabSelection';
import { AccountsStackRoutes, AppTabsRoutes } from '../../routes';
import { type TabsOptions } from '../../types';

const state: TabNavigationState<ParamListBase> = {
    stale: false,
    type: 'tab',
    key: 'tabs',
    index: 0,
    routeNames: [AppTabsRoutes.HomeStack, AppTabsRoutes.AccountsStack, AppTabsRoutes.Settings],
    routes: [
        { key: 'home', name: AppTabsRoutes.HomeStack },
        { key: 'accounts', name: AppTabsRoutes.AccountsStack },
        { key: 'settings', name: AppTabsRoutes.Settings },
    ],
    history: [{ type: 'route', key: 'home' }],
    preloadedRouteKeys: [],
};

const tabItemOptions: TabsOptions = {
    [AppTabsRoutes.AccountsStack]: {
        routeName: AppTabsRoutes.AccountsStack,
        iconName: 'discover',
        focusedIconName: 'discoverFilled',
        params: { screen: AccountsStackRoutes.Accounts },
    },
};

const createNavigation = () => {
    const event = {
        type: 'tabPress' as const,
        target: 'accounts',
        data: undefined,
        defaultPrevented: false,
        preventDefault: () => {
            event.defaultPrevented = true;
        },
    };
    const getState = mock<NativeTabNavigation['getState']>(() => state);
    const dispatch = mock<NativeTabNavigation['dispatch']>();
    const emit = mock<NativeTabNavigation['emit']>(() => event);
    const navigation = { getState, dispatch, emit };

    return { navigation, event };
};

describe(selectNativeTab.name, () => {
    it('emits a preventable press and preserves the configured Accounts destination', () => {
        const { navigation } = createNavigation();

        expect(selectNativeTab({ routeKey: 'accounts', state, navigation, tabItemOptions })).toBe(
            true,
        );

        expect(navigation.emit).toHaveBeenCalledWith({
            type: 'tabPress',
            target: 'accounts',
            canPreventDefault: true,
        });
        expect(navigation.dispatch).toHaveBeenCalledWith({
            type: 'NAVIGATE',
            target: 'tabs',
            payload: { name: AppTabsRoutes.AccountsStack, params: { screen: 'Accounts' } },
        });
    });

    it('honors cancellation by a screen listener', () => {
        const { navigation, event } = createNavigation();
        navigation.emit.mockImplementation(() => {
            event.preventDefault();

            return event;
        });

        expect(selectNativeTab({ routeKey: 'accounts', state, navigation, tabItemOptions })).toBe(
            false,
        );
        expect(navigation.dispatch).not.toHaveBeenCalled();
    });

    it.each(['removed-route', 'accounts'])('ignores a stale or invalid selection: %s', routeKey => {
        const { navigation } = createNavigation();
        navigation.getState.mockReturnValue({
            ...state,
            routes: state.routes.filter(route => route.key !== 'accounts'),
        });

        expect(selectNativeTab({ routeKey, state, navigation, tabItemOptions })).toBe(false);
        expect(navigation.emit).not.toHaveBeenCalled();
        expect(navigation.dispatch).not.toHaveBeenCalled();
    });

    it('does not override a redirect performed by a press listener', () => {
        const { navigation, event } = createNavigation();
        navigation.emit.mockImplementation(() => {
            navigation.getState.mockReturnValue({ ...state, index: 2 });

            return event;
        });

        expect(selectNativeTab({ routeKey: 'accounts', state, navigation, tabItemOptions })).toBe(
            false,
        );
        expect(navigation.dispatch).not.toHaveBeenCalled();
    });

    it('rechecks route identity after a listener unregisters and replaces the screen', () => {
        const { navigation, event } = createNavigation();
        navigation.emit.mockImplementation(() => {
            navigation.getState.mockReturnValue({
                ...state,
                routes: state.routes.map(route =>
                    route.key === 'accounts' ? { ...route, key: 'replacement-accounts' } : route,
                ),
            });

            return event;
        });

        expect(selectNativeTab({ routeKey: 'accounts', state, navigation, tabItemOptions })).toBe(
            false,
        );
        expect(navigation.dispatch).not.toHaveBeenCalled();
    });

    it('clears a previous coin filter when returning to the configured Accounts destination', () => {
        const { navigation, event } = createNavigation();
        navigation.emit.mockImplementation(() => {
            navigation.getState.mockReturnValue({
                ...state,
                routes: state.routes.map(route =>
                    route.key === 'accounts'
                        ? {
                              ...route,
                              params: {
                                  screen: AccountsStackRoutes.Accounts,
                                  params: { networksFilter: ['eth'] },
                              },
                          }
                        : route,
                ),
            });

            return event;
        });

        selectNativeTab({ routeKey: 'accounts', state, navigation, tabItemOptions });

        expect(navigation.dispatch).toHaveBeenCalledWith({
            type: 'NAVIGATE',
            target: 'tabs',
            payload: {
                name: AppTabsRoutes.AccountsStack,
                params: { screen: AccountsStackRoutes.Accounts },
            },
        });
    });

    it('forwards Android selected-tab presses to listeners without dispatching another selection', () => {
        const { navigation } = createNavigation();
        navigation.getState.mockReturnValue({ ...state, index: 1 });

        expect(
            selectNativeTab({
                routeKey: 'accounts',
                state: { ...state, index: 1 },
                navigation,
                tabItemOptions,
            }),
        ).toBe(false);
        expect(navigation.emit).toHaveBeenCalledTimes(1);
        expect(navigation.dispatch).not.toHaveBeenCalled();
    });

    it('ignores callbacks from the previously focused native view', () => {
        const { navigation } = createNavigation();
        navigation.getState.mockReturnValue({ ...state, index: 2 });

        expect(selectNativeTab({ routeKey: 'accounts', state, navigation, tabItemOptions })).toBe(
            false,
        );
        expect(navigation.emit).not.toHaveBeenCalled();
    });
});
