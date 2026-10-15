import { type PropsWithChildren } from 'react';

import { combineReducers } from '@reduxjs/toolkit';
import { act, fireEvent, screen } from '@testing-library/react';

import { type DesktopAnalytics, type DesktopAnalyticsDep } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import {
    type Route,
    type RouterRootState,
    getRoute,
    gotoThunk,
    routerLocationChange,
    routerReducer,
} from '@suite/router';
import { createTestCompositionRoot, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type YieldRootState,
    getYieldSessionKey,
    initialStablecoinYieldSessionState,
    initialStablecoinYieldState,
    yieldActions,
    yieldReducer,
} from '@suite-common/wallet-core';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mock } from '@trezor/dependency-injection';
import { type WithServices } from '@trezor/redux-utils';

import { useYieldBackNavigation } from './useYieldBackNavigation';
import { YieldFlowComplete } from '../common/YieldFlowComplete';

let mockResolvedFlowKey: string | null = 'test-yield-flow';

jest.mock('src/hooks/suite/useLayoutSize', () => ({
    useLayoutSize: () => ({ isBelowMobile: false }),
}));
jest.mock('src/components/earn/common/EarnFlowFeedbackCard', () => ({
    EarnFlowFeedbackCard: () => null,
}));
jest.mock('@suite/intl', () => ({ Translation: () => null }));
jest.mock('@trezor/components', () => {
    const Container = ({ children }: PropsWithChildren) => <div>{children}</div>;

    return {
        Column: Container,
        Card: Container,
        Row: Container,
        Text: Container,
        Divider: () => null,
        Icon: () => null,
        IconCircle: () => null,
        Button: ({ onClick, children }: PropsWithChildren<{ onClick: () => void }>) => (
            <button onClick={onClick}>{children}</button>
        ),
    };
});

const CompletionScreen = ({ children }: PropsWithChildren) => (
    <YieldFlowComplete type="deposit" heading="Done" description="">
        {children}
    </YieldFlowComplete>
);

jest.mock('@suite/router', () => ({
    ...jest.requireActual('@suite/router'),
    gotoThunk: jest.fn(() => ({
        type: 'router/routerLocationChange',
        payload: { app: 'earn', route: { name: 'suite-earn' }, params: undefined },
    })),
}));
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    getResolvedYieldFlowData: () => ({ flowKey: mockResolvedFlowKey }),
}));

const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
const requireRoute = <TName extends Route['name']>(name: TName) => {
    const route = getRoute(name);
    if (!route) throw new Error(`Missing test route: ${name}`);

    return route as Extract<Route, { name: TName }>;
};

const earnLocation = {
    pathname: '/earn',
    app: 'earn',
    route: requireRoute('suite-earn'),
    params: undefined,
} as const;

const setup = (
    sessionType: 'deposit' | 'withdraw' | 'redeem' | 'claim',
    complete = false,
    wrapper?: typeof CompletionScreen,
) => {
    const flowType = sessionType === 'redeem' ? 'withdraw' : sessionType;
    const flowKey = flowType === 'claim' ? account.key : 'test-yield-flow';
    const analytics = mockDesktopAnalytics(mock<DesktopAnalytics['report']>());
    const { services } = createTestCompositionRoot<
        WithServices<DesktopAnalyticsDep>,
        YieldRootState & RouterRootState
    >({
        reducer: combineReducers({
            router: routerReducer,
            wallet: combineReducers({ stablecoinYield: yieldReducer }),
        }),
        preloadedState: {
            router: {
                ...routerReducer(undefined, { type: 'test/init' }),
                app: 'earn-yield',
                route: requireRoute(`earn-yield-${flowType}`),
                params: undefined,
            },
            wallet: {
                stablecoinYield: {
                    ...initialStablecoinYieldState,
                    [sessionType]: {
                        [getYieldSessionKey(flowKey)]: {
                            ...initialStablecoinYieldSessionState,
                            step: complete ? 'complete' : 'action',
                        },
                    },
                },
            },
        },
        services: () => ({ analytics }),
    });
    const hook = renderHookWithStoreProvider(() => useYieldBackNavigation({ flowType, account }), {
        services,
        wrapper,
    });

    return { ...hook, analytics, store: services.store, flowType };
};

describe('useYieldBackNavigation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockResolvedFlowKey = 'test-yield-flow';
    });

    it.each(['deposit', 'withdraw', 'redeem', 'claim'] as const)(
        'reports an unfinished %s exit through the Earn sidebar or browser history',
        sessionType => {
            const { analytics, store, unmount, flowType } = setup(sessionType);

            act(() => store.dispatch(routerLocationChange(earnLocation)));
            unmount();

            expect(analytics.report).toHaveBeenCalledTimes(1);
            expect(analytics.report).toHaveBeenCalledWith({
                type: 'yield/navigate',
                payload: {
                    action: 'cancel',
                    from: `${flowType}-form`,
                    to: 'earn-dashboard',
                    networkSymbol: 'eth',
                },
            });
        },
    );

    it.each(['deposit', 'withdraw', 'redeem', 'claim'] as const)(
        'reports one unfinished %s exit through the page back button',
        sessionType => {
            const { analytics, result, unmount, flowType } = setup(sessionType);

            act(() => result.current());
            unmount();

            expect(analytics.report).toHaveBeenCalledTimes(1);
            expect(analytics.report).toHaveBeenCalledWith({
                type: 'yield/navigate',
                payload: expect.objectContaining({ action: 'cancel', from: `${flowType}-form` }),
            });
            expect(gotoThunk).toHaveBeenCalledWith({ routeName: 'suite-earn' });
        },
    );

    it.each(['deposit', 'withdraw', 'redeem', 'claim'] as const)(
        'reports continue when leaving a completed %s through the sidebar',
        sessionType => {
            const { analytics, store, unmount } = setup(sessionType, true);

            act(() => store.dispatch(routerLocationChange(earnLocation)));
            unmount();

            expect(analytics.report).toHaveBeenCalledTimes(1);
            expect(analytics.report).toHaveBeenCalledWith({
                type: 'yield/navigate',
                payload: expect.objectContaining({ action: 'continue' }),
            });
        },
    );

    it('uses completion reached after the page was opened', () => {
        const { analytics, store, unmount } = setup('deposit');

        act(() =>
            store.dispatch(
                yieldActions.setPendingTx({
                    flowType: 'deposit',
                    flowKey: 'test-yield-flow',
                    tx: { type: 'deposit', txid: '0xdeposittxid', amount: '1' },
                }),
            ),
        );
        act(() =>
            store.dispatch(
                yieldActions.completeAction({
                    flowType: 'deposit',
                    flowKey: 'test-yield-flow',
                    amount: '1',
                    txid: '0xdeposittxid',
                }),
            ),
        );
        act(() => store.dispatch(routerLocationChange(earnLocation)));
        unmount();

        expect(analytics.report).toHaveBeenCalledTimes(1);
        expect(analytics.report).toHaveBeenCalledWith({
            type: 'yield/navigate',
            payload: expect.objectContaining({ action: 'continue' }),
        });
    });

    it('stops observing navigation when its form is unmounted', () => {
        const { analytics, store, unmount } = setup('claim');
        unmount();

        act(() => store.dispatch(routerLocationChange(earnLocation)));

        expect(analytics.report).not.toHaveBeenCalled();
    });

    it('does not report rerenders or an unmount while the route stays unchanged', () => {
        const { analytics, rerender, unmount } = setup('deposit');

        rerender();
        unmount();

        expect(analytics.report).not.toHaveBeenCalled();
    });

    it('does not label navigation to another app as a return to Earn', () => {
        const { analytics, store, unmount } = setup('claim');

        act(() =>
            store.dispatch(
                routerLocationChange({
                    pathname: '/',
                    app: 'dashboard',
                    route: requireRoute('suite-index'),
                    params: undefined,
                }),
            ),
        );
        unmount();
        act(() => store.dispatch(routerLocationChange(earnLocation)));

        expect(analytics.report).not.toHaveBeenCalled();
    });

    it('reports one continue from the completion screen overview button', () => {
        const { analytics, unmount } = setup('deposit', true, CompletionScreen);

        fireEvent.click(screen.getByRole('button'));
        unmount();

        expect(analytics.report).toHaveBeenCalledTimes(1);
        expect(analytics.report).toHaveBeenCalledWith({
            type: 'yield/navigate',
            payload: expect.objectContaining({ action: 'continue', networkSymbol: 'eth' }),
        });
    });

    it('preserves completion when route teardown clears its session', () => {
        const { analytics, store, unmount } = setup('deposit', true);

        act(() => {
            store.dispatch(routerLocationChange(earnLocation));
            store.dispatch(
                yieldActions.resetSession({ flowType: 'deposit', flowKey: 'test-yield-flow' }),
            );
        });
        unmount();

        expect(analytics.report).toHaveBeenCalledTimes(1);
        expect(analytics.report).toHaveBeenCalledWith({
            type: 'yield/navigate',
            payload: expect.objectContaining({ action: 'continue' }),
        });
    });

    it('does not report cancellation for a flow that never resolved, such as a firmware redirect', () => {
        mockResolvedFlowKey = null;
        const { analytics, store, unmount } = setup('deposit');

        act(() => store.dispatch(routerLocationChange(earnLocation)));
        unmount();

        expect(analytics.report).not.toHaveBeenCalled();
    });
});
