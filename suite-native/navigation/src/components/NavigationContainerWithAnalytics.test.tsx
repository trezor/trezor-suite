import { type ReactNode } from 'react';

import { NavigationContainer } from '@react-navigation/native';

import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { act, renderHookWithBasicProvider } from '@suite-native/test-utils';
import { mock } from '@trezor/dependency-injection';

import {
    NavigationContainerWithAnalytics,
    navigationContainerRef,
    useEarnEntryId,
} from './NavigationContainerWithAnalytics';
import { EarnStackRoutes } from '../routes';

let mockRoute: { name: EarnStackRoutes.Earn; key: string } = {
    name: EarnStackRoutes.Earn,
    key: 'earn-first',
};

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    NavigationContainer: jest.fn(({ children }: { children: ReactNode }) => children),
    useRoute: () => mockRoute,
}));
jest.mock('@rozenite/react-navigation-plugin', () => ({ useReactNavigationDevTools: jest.fn() }));
jest.mock('@suite-native/sentry', () => ({
    addSentryBreadcrumb: jest.fn(),
    registerSentryNavigationContainer: jest.fn(),
    setSentryTag: jest.fn(),
}));

const changeNavigationState = () =>
    jest.mocked(NavigationContainer).mock.calls.at(-1)?.[0].onStateChange?.(undefined);

describe('Earn entry ownership', () => {
    beforeEach(() => {
        mockRoute = { name: EarnStackRoutes.Earn, key: 'earn-first' };
        jest.spyOn(navigationContainerRef, 'getCurrentRoute').mockImplementation(() => mockRoute);
        jest.spyOn(navigationContainerRef, 'isReady').mockReturnValue(true);
    });

    afterEach(() => jest.restoreAllMocks());

    it('waits for the new screen entry instead of reusing the previous visit on remount', async () => {
        const services: NativeAnalyticsDep = {
            analytics: mockNativeAnalytics(mock<NativeAnalyticsDep['analytics']['report']>()),
        };
        const { result, rerender } = await renderHookWithBasicProvider(useEarnEntryId, {
            services,
            wrapper: NavigationContainerWithAnalytics,
        });
        expect(result.current).toBe(0);

        await act(() => jest.mocked(NavigationContainer).mock.calls.at(-1)?.[0].onReady?.());
        expect(result.current).toBe(1);

        mockRoute = { name: EarnStackRoutes.Earn, key: 'earn-remounted' };
        await rerender(undefined);
        expect(result.current).toBe(0);

        await act(changeNavigationState);
        expect(result.current).toBe(2);

        expect(services.analytics.report).toHaveBeenCalledTimes(2);
        expect(services.analytics.report).toHaveBeenLastCalledWith({
            type: 'yield/earn-entry',
            payload: { from: 'Earn' },
        });
    });
});
