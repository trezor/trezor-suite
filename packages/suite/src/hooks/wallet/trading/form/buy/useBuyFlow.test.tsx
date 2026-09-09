import { locksReducer } from '@suite/locks';
import { modalReducer } from '@suite/modal';
import { routerReducer } from '@suite/router';
import { mockSuiteRouterHistory } from '@suite/router/mocks';
import { createTestCompositionRoot, renderHookWithStoreProvider } from '@suite-common/test-utils';

import { useBuyFlow } from './useBuyFlow';

jest.mock('@suite-common/trading', () => {
    const actual = jest.requireActual('@suite-common/trading');

    return {
        ...actual,
        tradingThunks: {
            ...actual.tradingThunks,
            loadInitialDataThunk: (args: unknown) => ({ type: 'trading/loadInitialData', args }),
        },
    };
});

type Props = {
    isFromRedirect?: boolean;
    quotesRequest?: unknown;
    isAmountEmpty?: boolean;
};

const renderBuyFlow = ({
    isFromRedirect = false,
    quotesRequest = undefined,
    isAmountEmpty = false,
}: Props = {}) => {
    const suiteRouterHistory = { ...mockSuiteRouterHistory(), navigate: jest.fn() };
    const root = createTestCompositionRoot({
        extra: {
            services: { suiteRouterHistory },
        },
        reducer: {
            router: routerReducer,
            locks: locksReducer,
            modal: modalReducer,
            wallet: (wallet = { trading: { buy: { quotes: [] } } }) => wallet,
        },
        preloadedState: {
            wallet: { trading: { buy: { quotes: [] } } },
        },
    });

    renderHookWithStoreProvider(
        () =>
            useBuyFlow({
                isFromRedirect,
                quotesRequest: quotesRequest as never,
                isAmountEmpty,
            }),
        { root },
    );

    const { getActions } = root.services;

    return { getActions, suiteRouterHistory };
};

describe('useBuyFlow', () => {
    it('dispatches the initial data load once on mount', () => {
        const { getActions } = renderBuyFlow();

        expect(
            getActions().filter(action => action.type === 'trading/loadInitialData'),
        ).toHaveLength(1);
    });

    it('navigates to the confirm page when both the redirect flag and quotes request are present', () => {
        const { suiteRouterHistory } = renderBuyFlow({
            isFromRedirect: true,
            quotesRequest: { some: 'request' },
        });

        expect(suiteRouterHistory.navigate).toHaveBeenCalledWith({
            pathname: '/accounts/coinmarket/buy/confirm',
            hash: '',
        });
    });

    it('does not navigate when the redirect flag is not set', () => {
        const { suiteRouterHistory } = renderBuyFlow({
            isFromRedirect: false,
            quotesRequest: { some: 'request' },
        });

        expect(suiteRouterHistory.navigate).not.toHaveBeenCalled();
    });

    it('does not navigate when there is no quotes request', () => {
        const { suiteRouterHistory } = renderBuyFlow({
            isFromRedirect: true,
            quotesRequest: undefined,
        });

        expect(suiteRouterHistory.navigate).not.toHaveBeenCalled();
    });
});
