import { createMemoryHistory } from 'history';

import { locksInitialState, locksReducer } from '@suite/locks';
import { modalReducer } from '@suite/modal';
import { createSuiteRouterHistory, routerReducer } from '@suite/router';

import { AppState } from 'src/reducers/store';
import suiteReducer from 'src/reducers/suite/suiteReducer';
import { configureStore } from 'src/support/tests/configureStore';

import * as fixtures from '../__fixtures__/routerActions';
import * as routerActions from '../routerActions';

type SuiteState = ReturnType<typeof suiteReducer>;
type RouterState = ReturnType<typeof routerReducer>;

const defaultLocation = {
    pathname: '/',
    state: undefined,
    key: '',
    hash: '',
    search: '',
} as const;

interface InitialState {
    suite?: Partial<SuiteState>;
    router?: Partial<RouterState>;
}

const getInitialState = (
    state: InitialState | undefined,
): Pick<AppState, 'suite' | 'router' | 'modal' | 'analytics' | 'locks'> => {
    const suite = state ? state.suite : undefined;
    const router = state ? state.router : undefined;

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

        const { suite, router, locks } = store.getState();
        store.getState().suite = suiteReducer(suite, action);
        store.getState().router = routerReducer(router, action);
        store.getState().locks = locksReducer(locks, action);
        // add action back to stack
        store.getActions().push(action);
    });

    return { store, suiteRouterHistory };
};

// Note: Most router actions have been moved to @suite/router. These stay here just because there is still dependency on suite.flags,
// but once that is separated from suite state into it's own package, these actions should move to @suite/router too.
describe('Suite Router Actions', () => {
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
});
