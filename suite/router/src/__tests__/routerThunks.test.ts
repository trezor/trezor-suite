import { createMemoryHistory } from 'history';

import { locksInitialState, locksReducer } from '@suite/locks';
import { modalReducer } from '@suite/modal';
import { configureMockStore } from '@suite-common/test-utils';

import * as fixtures from '../__fixtures__/routerThunks';
import { createSuiteRouterHistory } from '../createSuiteRouterHistory';
import { routerReducer } from '../routerReducer';
import {
    closeModalApp,
    goto,
    initialRedirection,
    onLocationChange,
    routerInit,
} from '../routerThunks';

const EMPTY_ACTION = { type: 'foo' };

const defaultLocation = {
    pathname: '/',
    state: undefined,
    key: '',
    hash: '',
    search: '',
} as const;

const getInitialState = (state?: any) => {
    const router = state?.router;
    const locks = state?.locks;

    return {
        router: {
            ...routerReducer(undefined, EMPTY_ACTION),
            ...router,
        },
        modal: modalReducer(undefined, EMPTY_ACTION),
        analytics: {
            confirmed: false,
        },
        locks: {
            ...locksInitialState,
            ...locks,
        },
    };
};

const initStore = (state: ReturnType<typeof getInitialState>) => {
    const suiteRouterHistory = createSuiteRouterHistory({ history: createMemoryHistory() });
    const store = configureMockStore({
        reducer: {
            router: routerReducer,
            modal: modalReducer,
            locks: locksReducer,
            analytics: (s: any = { confirmed: false }) => s,
        },
        preloadedState: state,
        extra: {
            services: { suiteRouterHistory } as any,
        },
    });

    return { store, suiteRouterHistory };
};

describe('Router thunks', () => {
    fixtures.init.forEach(f => {
        it(`init: ${f.description}`, () => {
            const state = getInitialState(f.state);
            const { store, suiteRouterHistory } = initStore(state);
            suiteRouterHistory.navigate(defaultLocation);
            store.dispatch(routerInit());
            if (f.result) {
                expect(store.getState().router).toEqual(f.result);
            } else {
                expect(
                    store.getActions().filter(a => !a.type.startsWith('@router/init')).length,
                ).toEqual(0);
            }
        });
    });

    fixtures.goto.forEach(f => {
        it(`goto: ${f.description}`, () => {
            const state = getInitialState(f.state);
            const { store, suiteRouterHistory } = initStore(state);
            suiteRouterHistory.navigate({ ...defaultLocation, hash: `#${f.hash}` });
            store.dispatch(onLocationChange(suiteRouterHistory.getLocation()));

            store.dispatch(
                goto({
                    routeName: f.url as Parameters<typeof goto>[0]['routeName'],
                    preserveParams: f.preserveHash,
                }),
            );
            if (f.result) {
                expect(
                    suiteRouterHistory.getLocation().pathname +
                        suiteRouterHistory.getLocation().hash,
                ).toEqual(f.result);
            }
        });
    });

    it(`onLocationChange with lock`, () => {
        const state = getInitialState({
            locks: { router: 1 },
            router: { loaded: true },
        });
        const { store } = initStore(state);
        store.dispatch(onLocationChange({ pathname: '/' }));
        expect(
            store.getActions().filter(a => !a.type.startsWith('@router/onLocationChange')).length,
        ).toEqual(0);
    });

    it('closeModalApp', () => {
        const state = getInitialState({ router: { pathname: '/firmware' } });
        const { store, suiteRouterHistory } = initStore(state);
        suiteRouterHistory.navigate({
            ...defaultLocation,
            pathname: '/accounts/send',
        });

        store.dispatch(closeModalApp());
        expect(store.getState().router.app).toEqual('wallet');
        expect(store.getState().router.pathname).toEqual('/accounts/send');
    });

    fixtures.initialRedirection.forEach(f => {
        it(`initialRedirection: ${f.description}`, () => {
            const state = getInitialState(f.state);
            const { store, suiteRouterHistory } = initStore(state);

            suiteRouterHistory.navigate({
                ...defaultLocation,
                pathname: f.pathname || '/',
            });

            store.dispatch(initialRedirection({ isInitialRun: f.isInitialRun }));
            expect(store.getState().router.app).toEqual(f.app);
        });
    });
});
