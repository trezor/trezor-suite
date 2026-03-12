import { createMemoryHistory } from 'history';

import { LocksState, locksInitialState, locksReducer } from '@suite/locks';
import { modalReducer } from '@suite/modal';
import { createSuiteRouterHistory, routerReducer } from '@suite/router';

import { AppState } from 'src/reducers/store';
import suiteReducer from 'src/reducers/suite/suiteReducer';
import { configureStore } from 'src/support/tests/configureStore';

import * as fixtures from '../__fixtures__/routerActions';
import * as routerActions from '../routerActions';

type SuiteState = ReturnType<typeof suiteReducer>;
type RouterState = ReturnType<typeof routerReducer>;
type InitialRouterState = Partial<Omit<RouterState, 'route'>> & {
    route?: Partial<NonNullable<RouterState['route']>>;
};

const defaultLocation = {
    pathname: '/',
    state: undefined,
    key: '',
    hash: '',
    search: '',
} as const;

interface InitialState {
    suite?: Partial<SuiteState>;
    router?: InitialRouterState;
    locks?: Partial<LocksState>;
}

// some super long recursive type will make TSC to fail with export
const getInitialState = (
    state: InitialState | undefined,
): Pick<AppState, 'suite' | 'router' | 'modal' | 'analytics' | 'locks'> => {
    const suite = state ? state.suite : undefined;
    const router = state ? state.router : undefined;
    const locks = state ? state.locks : undefined;

    return {
        suite: {
            ...suiteReducer(undefined, { type: 'foo' } as any),
            ...suite,
        },
        router: {
            ...routerReducer(undefined, { type: 'foo' } as any),
            ...router,
        } as RouterState,
        modal: modalReducer(undefined, { type: 'foo' } as any),
        analytics: {
            confirmed: false,
        },
        locks: {
            ...locksInitialState,
            ...locks,
        },
    };
};

type State = ReturnType<typeof getInitialState>;

const initStore = (state: State) => {
    const suiteRouterHistory = createSuiteRouterHistory({ history: createMemoryHistory() });
    const store = configureStore<State, any>([], {
        services: { suiteRouterHistory },
    })(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        if (!action) {
            return;
        }

        const { suite, router, locks } = store.getState();
        store.getState().suite = suiteReducer(suite, action);
        store.getState().router = routerReducer(router, action);
        store.getState().locks = locksReducer(locks, action);
        // add action back to stack
        store.getActions().push(action);
    });

    return { store, suiteRouterHistory };
};

describe('Suite Actions', () => {
    fixtures.init.forEach(f => {
        it(`init: ${f.description}`, () => {
            const state = getInitialState(f.state as InitialState | undefined);
            const { store, suiteRouterHistory } = initStore(state);
            suiteRouterHistory.navigate(defaultLocation);
            store.dispatch(routerActions.init());
            if (f.result) {
                expect(store.getState().router).toEqual(f.result);
            } else {
                expect(store.getActions().length).toEqual(0);
            }
        });
    });
    fixtures.onBeforePopState.forEach(f => {
        it(`onBeforePopState: ${f.description}`, () => {
            const state = getInitialState(f.state as unknown as InitialState);
            const { store } = initStore(state);
            const result = store.dispatch(routerActions.onBeforePopState());
            expect(result).toEqual(f.result);
        });
    });

    fixtures.initialRedirection.forEach(f => {
        it(`initialRedirection: ${f.description}`, () => {
            const state = getInitialState(f.state as InitialState);
            const { store, suiteRouterHistory } = initStore(state);

            suiteRouterHistory.navigate({
                ...defaultLocation,
                pathname: f.pathname || '/',
            });

            store.dispatch(routerActions.initialRedirection());
            expect(store.getState().router.app).toEqual(f.app);
        });
    });

    fixtures.goto.forEach(f => {
        it(`goto: ${f.description}`, () => {
            const state = getInitialState(f.state as InitialState);
            const { store, suiteRouterHistory } = initStore(state);
            suiteRouterHistory.navigate({ ...defaultLocation, hash: `#${f.hash}` });
            store.dispatch(routerActions.onLocationChange(suiteRouterHistory.getLocation()));

            store.dispatch(
                routerActions.goto(f.url as Parameters<typeof routerActions.goto>[0], {
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
        } as InitialState);
        const { store } = initStore(state);
        store.dispatch(routerActions.onLocationChange({ pathname: '/' }));
        expect(store.getActions().length).toEqual(0);
    });

    it('closeModalApp', () => {
        const state = getInitialState({ router: { pathname: '/firmware' } });
        const { store, suiteRouterHistory } = initStore(state);
        suiteRouterHistory.navigate({
            ...defaultLocation,
            pathname: '/accounts/send',
        });

        store.dispatch(routerActions.closeModalApp());
        expect(store.getActions().length).toEqual(2); // unlock + location change
        expect(store.getState().router.app).toEqual('wallet');
        expect(store.getState().router.pathname).toEqual('/accounts/send');
    });
});
