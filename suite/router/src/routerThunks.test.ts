import { createMemoryHistory } from 'history';

import { locksInitialState, locksReducer } from '@suite/locks';
import { modalReducer } from '@suite/modal';
import { createTestCompositionRoot } from '@suite-common/test-utils';

import * as fixtures from './__fixtures__/routerThunks';
import { createSuiteRouterHistory } from './createSuiteRouterHistory';
import { routerReducer } from './routerReducer';
import {
    type GotoThunkDeps,
    type GotoThunkState,
    closeModalAppThunk,
    gotoThunk,
    initialRedirectionThunk,
    onLocationChangeThunk,
    routerInitThunk,
} from './routerThunks';

const EMPTY_ACTION = { type: 'foo' };

const defaultLocation = {
    pathname: '/',
    state: undefined,
    key: '',
    hash: '',
    search: '',
} as const;

const getInitialState = (state?: {
    router?: Record<string, unknown>;
    locks?: Partial<GotoThunkState['locks']>;
}): GotoThunkState => {
    const router = state?.router;
    const locks = state?.locks;

    return {
        router: {
            ...routerReducer(undefined, EMPTY_ACTION),
            ...router,
        } as GotoThunkState['router'],
        modal: modalReducer(undefined, EMPTY_ACTION),
        locks: {
            ...locksInitialState,
            ...locks,
        },
    };
};

const initStore = (state: GotoThunkState) => {
    const suiteRouterHistory = createSuiteRouterHistory({ history: createMemoryHistory() });
    const { store } = createTestCompositionRoot<GotoThunkDeps, GotoThunkState>({
        reducer: {
            router: routerReducer,
            modal: modalReducer,
            locks: locksReducer,
        },
        preloadedState: state,
        services: () => ({ suiteRouterHistory }),
    }).services;

    return { store, suiteRouterHistory };
};

describe('Router thunks', () => {
    fixtures.init.forEach(f => {
        it(`init: ${f.description}`, () => {
            const state = getInitialState(f.state);
            const { store, suiteRouterHistory } = initStore(state);
            suiteRouterHistory.navigate(defaultLocation);
            store.dispatch(routerInitThunk());
            if (f.result) {
                expect(store.getState().router).toEqual(f.result);
            } else {
                const actionsWithoutThunkLifecycleEvents = store
                    .getActions()
                    .filter(a => !a.type.startsWith(routerInitThunk.typePrefix));
                expect(actionsWithoutThunkLifecycleEvents.length).toEqual(0);
            }
        });
    });

    fixtures.goto.forEach(f => {
        it(`goto: ${f.description}`, () => {
            const state = getInitialState(f.state);
            const { store, suiteRouterHistory } = initStore(state);
            suiteRouterHistory.navigate({ ...defaultLocation, hash: `#${f.hash}` });
            store.dispatch(onLocationChangeThunk(suiteRouterHistory.getLocation()));

            store.dispatch(
                gotoThunk({
                    routeName: f.url as Parameters<typeof gotoThunk>[0]['routeName'],
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
        store.dispatch(onLocationChangeThunk({ pathname: '/' }));
        const actionsWithoutThunkLifecycleEvents = store
            .getActions()
            .filter(a => !a.type.startsWith(onLocationChangeThunk.typePrefix));
        expect(actionsWithoutThunkLifecycleEvents.length).toEqual(0);
    });

    it('closeModalApp', () => {
        const state = getInitialState({ router: { pathname: '/firmware' } });
        const { store, suiteRouterHistory } = initStore(state);
        suiteRouterHistory.navigate({
            ...defaultLocation,
            pathname: '/accounts/send',
        });

        store.dispatch(closeModalAppThunk());
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

            store.dispatch(initialRedirectionThunk({ isInitialRun: f.isInitialRun }));
            expect(store.getState().router.app).toEqual(f.app);
        });
    });
});
