import { configureMockStore, renderHookWithStoreProvider } from '@suite-common/test-utils';

import { useBuyFlow } from './useBuyFlow';

jest.mock('@suite/router', () => ({
    ...jest.requireActual('@suite/router'),
    goto: jest.fn((payload: unknown) => ({ type: '@router/goto', payload })),
}));

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
    const store = configureMockStore({
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
        { store },
    );

    return store;
};

const actionTypes = (store: ReturnType<typeof renderBuyFlow>) =>
    store.getActions().map(action => action.type);

describe('useBuyFlow', () => {
    it('dispatches the initial data load once on mount', () => {
        const store = renderBuyFlow();

        expect(
            store.getActions().filter(action => action.type === 'trading/loadInitialData'),
        ).toHaveLength(1);
    });

    it('navigates to the confirm page when both the redirect flag and quotes request are present', () => {
        const store = renderBuyFlow({ isFromRedirect: true, quotesRequest: { some: 'request' } });

        expect(actionTypes(store)).toContain('@router/goto');
    });

    it('does not navigate when the redirect flag is not set', () => {
        const store = renderBuyFlow({ isFromRedirect: false, quotesRequest: { some: 'request' } });

        expect(actionTypes(store)).not.toContain('@router/goto');
    });

    it('does not navigate when there is no quotes request', () => {
        const store = renderBuyFlow({ isFromRedirect: true, quotesRequest: undefined });

        expect(actionTypes(store)).not.toContain('@router/goto');
    });
});
