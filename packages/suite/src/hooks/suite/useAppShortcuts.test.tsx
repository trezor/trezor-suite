import { fireEvent } from '@testing-library/react';

import { type DesktopApiDep } from '@suite/desktop-app-api';
import { type RouterState, type SuiteRouterHistoryDep, routerReducer } from '@suite/router';
import { createRouterStateMockForRoute, mockSuiteRouterHistory } from '@suite/router/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { type WithServices } from '@trezor/redux-utils';

import { renderHookWithProviders } from '#src/support/test-utils/hooksHelper';

import { useAppShortcuts } from './useAppShortcuts';
import { type MockSuiteState, mockInitialAppState } from '../../../mocks';

type UseAppShortcutsTestDeps = WithServices<DesktopApiDep<'available'> & SuiteRouterHistoryDep>;

type RenderAppShortcutsParams = {
    router: RouterState;
    isDeviceConnected: boolean;
};

const renderAppShortcuts = ({ router, isDeviceConnected }: RenderAppShortcutsParams) => {
    const initialState: MockSuiteState = {
        ...mockInitialAppState,
        router,
        device: {
            ...mockInitialAppState.device,
            selectedDevice: mockSuiteDevice({
                connected: isDeviceConnected,
                available: isDeviceConnected,
            }),
        },
    };
    const { services } = createTestCompositionRoot<UseAppShortcutsTestDeps, MockSuiteState>({
        preloadedState: initialState,
        reducer: (state = initialState, action) => ({
            ...state,
            router: routerReducer(state.router, action),
        }),
        services: () => ({
            desktopApi: { available: false },
            suiteRouterHistory: mockSuiteRouterHistory(),
        }),
    });
    renderHookWithProviders(services, useAppShortcuts);

    return services.store;
};

type SwitcherShortcutCase = RenderAppShortcutsParams & {
    name: string;
    isSwitcherOpened: boolean;
};

describe(useAppShortcuts.name, () => {
    it.each<SwitcherShortcutCase>([
        {
            name: 'onboarding',
            router: createRouterStateMockForRoute('onboarding-index'),
            isDeviceConnected: true,
            isSwitcherOpened: false,
        },
        {
            name: 'Settings opened from onboarding',
            router: {
                ...createRouterStateMockForRoute('settings-index'),
                settingsBackRoute: { name: 'onboarding-index' },
            },
            isDeviceConnected: true,
            isSwitcherOpened: false,
        },
        {
            name: 'onboarding',
            router: createRouterStateMockForRoute('onboarding-index'),
            isDeviceConnected: false,
            isSwitcherOpened: true,
        },
        {
            name: 'the dashboard',
            router: createRouterStateMockForRoute('suite-index'),
            isDeviceConnected: true,
            isSwitcherOpened: true,
        },
    ])(
        'ALT+W opens the device switcher=$isSwitcherOpened in $name with device connected=$isDeviceConnected',
        ({ router, isDeviceConnected, isSwitcherOpened }) => {
            const store = renderAppShortcuts({ router, isDeviceConnected });

            fireEvent.keyDown(window, { code: 'KeyW', altKey: true });

            expect(store.getState().router.route?.name === 'suite-switch-device').toBe(
                isSwitcherOpened,
            );
        },
    );
});
