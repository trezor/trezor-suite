import '@suite-common/test-utils/globalOverrides';

import { type UnknownAction } from '@reduxjs/toolkit';
import { act, fireEvent, screen, within } from '@testing-library/react';

import { type DesktopAnalyticsDep, events } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import {
    type FlagsState,
    NewContentIndicatorId,
    flagsInitialState,
    prepareFlagsReducer,
} from '@suite/flags';
import {
    type PathString,
    type SuiteRouterHistoryDep,
    getAppWithParams,
    onLocationChangeThunk,
    routerLocationChange,
    routerReducer,
} from '@suite/router';
import { mockSuiteRouterHistory } from '@suite/router/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { type TransactionNotification } from '@suite-common/toast-notifications';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type WithServices } from '@trezor/redux-utils';

import { type AppState } from 'src/reducers/store';
import { extraDependencies } from 'src/support/extraDependencies';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { Navigation } from './Navigation';
import { SIDEBAR_MIN_WIDTH } from './consts';
import { mockInitialAppState } from '../../../../../../mocks/mockInitialAppState';

type TranslationMockProps = { id: string };

jest.mock('@suite/intl', () => ({
    ...jest.requireActual('@suite/intl'),
    Translation: ({ id }: TranslationMockProps) => <span>{id}</span>,
}));

const flagsReducer = prepareFlagsReducer(extraDependencies);
const analytics = mockDesktopAnalytics();
const services: DesktopAnalyticsDep & SuiteRouterHistoryDep = {
    analytics,
    suiteRouterHistory: mockSuiteRouterHistory(),
};

type RenderNavigationParams = {
    pathname?: PathString;
    isCollapsed?: boolean;
    seenNewContentIndicators?: FlagsState['seenNewContentIndicators'];
    notifications?: AppState['notifications'];
};

const renderNavigation = ({
    pathname = '/',
    isCollapsed = false,
    // Note: an empty object is NOT the default state (for fresh Suite, it's populated by all indicators).
    // Empty object simulates an existing user, which hasn't seen any content, migrating to a new version.
    seenNewContentIndicators = {},
    notifications = [],
}: RenderNavigationParams = {}) => {
    const preloadedState: AppState = {
        ...mockInitialAppState,
        flags: { ...flagsInitialState, seenNewContentIndicators },
        router: routerReducer(
            mockInitialAppState.router,
            routerLocationChange({ ...getAppWithParams({ pathname }), pathname }),
        ),
        suiteSettings: {
            ...mockInitialAppState.suiteSettings,
            sidebarWidth: isCollapsed ? SIDEBAR_MIN_WIDTH : 280,
        },
        notifications,
    };
    const root = createTestCompositionRoot<
        WithServices<DesktopAnalyticsDep & SuiteRouterHistoryDep>,
        AppState
    >({
        services: () => services,
        reducer: (state: Partial<AppState> = preloadedState, action: UnknownAction): AppState => {
            const currentState = { ...preloadedState, ...state };

            return {
                ...currentState,
                flags: flagsReducer(currentState.flags, action),
                router: routerReducer(currentState.router, action),
            };
        },
        preloadedState,
    });

    renderWithProviders(root.services, <Navigation />);

    return root;
};

const activityIndicator = '@suite/menu/notifications/new-content-indicator';
const earnIndicator = '@suite/menu/suite-earn/new-content-indicator';
const swapIndicator = '@suite/menu/wallet-trading-exchange/new-content-indicator';
const activityButton = '@suite/menu/notifications';
const earnButton = '@suite/menu/suite-earn';
const swapButton = '@suite/menu/wallet-trading-exchange';
const buttonDotIndicator = '[data-component="StatusBadge"]';

const transactionNotification: TransactionNotification = {
    id: 1,
    context: 'toast',
    type: 'raw-tx-sent',
    descriptor: 'test-account',
    txid: 'test-transaction',
    symbol: asNetworkSymbol('btc'),
    seen: false,
};

describe('Navigation new-content indicators', () => {
    beforeEach(() => {
        analytics.report.mockClear();
    });

    it('shows no historical badges or click events on a fresh start', () => {
        renderNavigation({ seenNewContentIndicators: flagsInitialState.seenNewContentIndicators });

        expect(screen.queryByTestId(activityIndicator)).not.toBeInTheDocument();
        expect(screen.queryByTestId(earnIndicator)).not.toBeInTheDocument();
        expect(screen.queryByTestId(swapIndicator)).not.toBeInTheDocument();

        fireEvent.click(screen.getByTestId(earnButton));
        fireEvent.click(screen.getByTestId(activityButton));
        fireEvent.click(screen.getByTestId(swapButton));
        expect(analytics.report).toHaveBeenCalledTimes(1);
        expect(analytics.report).toHaveBeenCalledWith({
            type: events.tradeNavigateEvent.name,
            payload: { action: 'navigate', type: 'exchange', from: 'sidebar' },
        });
    });

    it('keeps Activity, Earn and Swap visible independently for an existing installation', () => {
        renderNavigation();

        expect(screen.getByTestId(activityIndicator)).toHaveTextContent('TR_NEW');
        expect(screen.getByTestId(earnIndicator)).toHaveTextContent('TR_NEW');
        expect(screen.getByTestId(swapIndicator)).toHaveTextContent('TR_NEW');
    });

    it.each([false, true])(
        'clears Swap independently and reports its badge click once when collapsed=%s',
        isCollapsed => {
            const root = renderNavigation({ isCollapsed });
            const button = screen.getByTestId(swapButton);

            if (isCollapsed) {
                expect(button.querySelector(buttonDotIndicator)).toBeInTheDocument();
                expect(screen.queryByTestId(swapIndicator)).not.toBeInTheDocument();
            } else {
                expect(screen.getByTestId(swapIndicator)).toHaveTextContent('TR_NEW');
            }

            fireEvent.click(button);
            fireEvent.click(button);

            expect(screen.queryByTestId(swapIndicator)).not.toBeInTheDocument();
            expect(button.querySelector(buttonDotIndicator)).not.toBeInTheDocument();
            expect(root.services.store.getState().flags.seenNewContentIndicators).toEqual({
                [NewContentIndicatorId.Swap26_10]: true,
            });
            expect(analytics.report.mock.calls).toEqual([
                [
                    {
                        type: events.tradeNavigateEvent.name,
                        payload: { action: 'navigate', type: 'exchange', from: 'sidebar' },
                    },
                ],
                [
                    {
                        type: events.appNewContentBadgeEvent.name,
                        payload: { badgeId: NewContentIndicatorId.Swap26_10, origin: 'nav' },
                    },
                ],
                [
                    {
                        type: events.tradeNavigateEvent.name,
                        payload: { action: 'navigate', type: 'exchange', from: 'sidebar' },
                    },
                ],
            ]);
        },
    );

    it.each([
        '/accounts/coinmarket/exchange',
        '/accounts/coinmarket/exchange/confirm',
        '/accounts/coinmarket/exchange/detail',
    ] as const)('clears Swap on direct entry to %s without click analytics', pathname => {
        const root = renderNavigation({ pathname });

        expect(root.services.store.getState().flags.seenNewContentIndicators).toEqual({
            [NewContentIndicatorId.Swap26_10]: true,
        });
        expect(screen.queryByTestId(swapIndicator)).not.toBeInTheDocument();
        expect(screen.getByTestId(earnIndicator)).toBeInTheDocument();
        expect(screen.getByTestId(activityIndicator)).toBeInTheDocument();
        expect(analytics.report).not.toHaveBeenCalled();
    });

    it.each(['/accounts/coinmarket/buy', '/accounts/coinmarket/sell'] as const)(
        'keeps Swap unseen when starting at %s',
        pathname => {
            renderNavigation({ pathname });

            expect(screen.getByTestId(swapIndicator)).toBeInTheDocument();
            expect(analytics.report).not.toHaveBeenCalled();
        },
    );

    it.each([
        {
            button: earnButton,
            indicator: earnIndicator,
            other: activityIndicator,
            id: NewContentIndicatorId.Earn26_8,
        },
        {
            button: activityButton,
            indicator: activityIndicator,
            other: earnIndicator,
            id: NewContentIndicatorId.Activity26_8,
        },
    ])('clears only $id and reports its click once', ({ button, indicator, other, id }) => {
        const root = renderNavigation();

        fireEvent.click(screen.getByTestId(button));
        fireEvent.click(screen.getByTestId(button));

        expect(screen.queryByTestId(indicator)).not.toBeInTheDocument();
        expect(screen.getByTestId(other)).toBeInTheDocument();
        expect(root.services.store.getState().flags.seenNewContentIndicators).toEqual({
            [id]: true,
        });
        expect(analytics.report).toHaveBeenCalledTimes(1);
        expect(analytics.report).toHaveBeenCalledWith({
            type: events.appNewContentBadgeEvent.name,
            payload: { badgeId: id, origin: 'nav' },
        });
    });

    it.each(['/earn', '/earn/yield/deposit', '/earn/tron/stake'] as const)(
        'clears Earn when starting directly at %s without click analytics',
        pathname => {
            const root = renderNavigation({ pathname });

            expect(root.services.store.getState().flags.seenNewContentIndicators).toEqual({
                [NewContentIndicatorId.Earn26_8]: true,
            });
            expect(screen.queryByTestId(earnIndicator)).not.toBeInTheDocument();
            expect(screen.getByTestId(activityIndicator)).toBeInTheDocument();
            expect(analytics.report).not.toHaveBeenCalled();
        },
    );

    it('clears Activity on direct entry without click analytics', () => {
        const root = renderNavigation({ pathname: '/notifications' });

        expect(root.services.store.getState().flags.seenNewContentIndicators).toEqual({
            [NewContentIndicatorId.Activity26_8]: true,
        });
        expect(screen.queryByTestId(activityIndicator)).not.toBeInTheDocument();
        expect(screen.getByTestId(earnIndicator)).toBeInTheDocument();
        expect(analytics.report).not.toHaveBeenCalled();
    });

    it.each([
        { pathname: '/earn', indicator: earnIndicator },
        { pathname: '/accounts/coinmarket/exchange', indicator: swapIndicator },
    ] as const)(
        'clears $pathname opened outside sidebar navigation',
        async ({ pathname, indicator }) => {
            const root = renderNavigation();

            await act(async () => {
                await root.services.store.dispatch(onLocationChangeThunk({ pathname }));
            });

            expect(screen.queryByTestId(indicator)).not.toBeInTheDocument();
            expect(screen.getByTestId(activityIndicator)).toBeInTheDocument();
            expect(analytics.report).not.toHaveBeenCalled();
        },
    );

    it.each([
        {
            scenario: 'older Earn changes were seen',
            seenRetiredIndicators: { 'earn-26.6': true, 'earn-26.7': true } as const,
        },
        { scenario: 'older Earn releases were skipped', seenRetiredIndicators: {} },
    ])('shows one current Earn badge when $scenario', ({ seenRetiredIndicators }) => {
        const root = renderNavigation({
            seenNewContentIndicators: {
                ...seenRetiredIndicators,
                [NewContentIndicatorId.Activity26_8]: true,
            },
        });

        expect(within(screen.getByTestId(earnButton)).getAllByText('TR_NEW')).toHaveLength(1);
        fireEvent.click(screen.getByTestId(earnButton));

        expect(screen.queryByTestId(earnIndicator)).not.toBeInTheDocument();
        expect(root.services.store.getState().flags.seenNewContentIndicators).toEqual({
            ...seenRetiredIndicators,
            [NewContentIndicatorId.Activity26_8]: true,
            [NewContentIndicatorId.Earn26_8]: true,
        });
        expect(screen.getByTestId(swapIndicator)).toBeInTheDocument();
        expect(analytics.report).toHaveBeenCalledTimes(1);
        expect(analytics.report).toHaveBeenCalledWith({
            type: events.appNewContentBadgeEvent.name,
            payload: { badgeId: NewContentIndicatorId.Earn26_8, origin: 'nav' },
        });
    });

    it('shows a violet dot in collapsed navigation and reports its click', () => {
        renderNavigation({ isCollapsed: true });
        const button = screen.getByTestId(earnButton);

        expect(screen.queryByTestId(earnIndicator)).not.toBeInTheDocument();
        expect(button.querySelector(buttonDotIndicator)).toBeInTheDocument();
        fireEvent.click(button);

        expect(button.querySelector(buttonDotIndicator)).not.toBeInTheDocument();
        expect(analytics.report).toHaveBeenCalledTimes(1);
    });

    it.each([false, true])(
        'preserves the red Activity indicator and suppresses obscured badge analytics when collapsed=%s',
        async isCollapsed => {
            const root = renderNavigation({
                isCollapsed,
                notifications: [transactionNotification],
            });
            const button = screen.getByTestId(activityButton);

            expect(button.querySelector(buttonDotIndicator)).toBeInTheDocument();
            expect(screen.queryByTestId(activityIndicator) !== null).toBe(!isCollapsed);
            fireEvent.click(button);

            expect(screen.queryByTestId(activityIndicator)).not.toBeInTheDocument();
            expect(button.querySelector(buttonDotIndicator)).not.toBeInTheDocument();
            expect(root.services.store.getState().notifications).toEqual([transactionNotification]);
            expect(analytics.report).toHaveBeenCalledTimes(isCollapsed ? 0 : 1);

            await act(async () => {
                await root.services.store.dispatch(onLocationChangeThunk({ pathname: '/' }));
            });
            expect(button.querySelector(buttonDotIndicator)).toBeInTheDocument();
            expect(screen.queryByTestId(activityIndicator)).not.toBeInTheDocument();
        },
    );
});
