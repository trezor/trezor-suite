import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import suiteReducer from '@suite-reducers/suiteReducer';
import routerReducer from '@suite-reducers/routerReducer';
import modalReducer from '@suite-reducers/modalReducer';
import * as fixtures from '../__fixtures__/routerActions';
import * as routerActions from '../routerActions';

jest.mock('next/router', () => {
    const history: string[] = [];
    let dispatch: Function = () => {};
    return {
        __esModule: true, // this property makes it work
        default: {
            push: (_url: string, asUrl: string) => {
                history.push(asUrl);
                dispatch(asUrl);
            },
            pathname: '/',
        },
        setDispatch: (d: Function) => {
            dispatch = d;
        },
    };
});

type SuiteState = ReturnType<typeof suiteReducer>;
type RouterState = ReturnType<typeof routerReducer>;
interface InitialState {
    suite?: Partial<SuiteState>;
    router?: Exclude<RouterState, 'app|url|pathname'>;
}

export const getInitialState = (state: InitialState | undefined) => {
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
        },
        modal: modalReducer(undefined, { type: 'foo' } as any),
    };
};

type State = ReturnType<typeof getInitialState>;
const mockStore = configureStore<State, any>([thunk]);

const initStore = (state: State) => {
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { suite, router } = store.getState();
        store.getState().suite = suiteReducer(suite, action);
        store.getState().router = routerReducer(router, action);
        // add action back to stack
        store.getActions().push(action);
    });
    return store;
};

describe('Suite Actions', () => {
    fixtures.init.forEach(f => {
        it(`init: ${f.description}`, async () => {
            const state = getInitialState(f.state as InitialState);
            const store = initStore(state);
            store.dispatch(routerActions.init());
            if (f.result) {
                expect(store.getState().router).toEqual(f.result);
            } else {
                expect(store.getActions().length).toEqual(0);
            }
        });
    });

    fixtures.onBeforePopState.forEach(f => {
        it(`onBeforePopState: ${f.description}`, async () => {
            const state = getInitialState(f.state as InitialState);
            const store = initStore(state);
            const result = store.dispatch(routerActions.onBeforePopState());
            expect(result).toEqual(f.result);
        });
    });

    fixtures.initialRedirection.forEach(f => {
        it(`initialRedirection: ${f.description}`, async () => {
            const state = getInitialState(f.state as InitialState);
            const store = initStore(state);
            // eslint-disable-next-line global-require
            require('next/router').default.pathname = f.pathname || '/';
            // eslint-disable-next-line global-require
            require('next/router').setDispatch((url: string) => {
                store.dispatch(routerActions.onLocationChange(url));
            });
            store.dispatch(routerActions.initialRedirection());
            expect(store.getState().router.app).toEqual(f.app);
        });
    });

    fixtures.goto.forEach(f => {
        it(`goto: ${f.description}`, async () => {
            const state = getInitialState(f.state as InitialState);
            const store = initStore(state);
            // eslint-disable-next-line global-require
            require('next/router').setDispatch((url: string) => {
                store.dispatch(routerActions.onLocationChange(url));
            });
            // @ts-ignore
            window.location.hash = f.hash;
            store.dispatch(routerActions.goto(f.url as any, undefined, f.preserveHash));
            if (f.result) {
                expect(store.getActions()[0].url).toEqual(f.result);
                expect(store.getActions().length).toEqual(1);
            } else {
                expect(store.getActions().length).toEqual(0);
            }
        });
    });

    it(`onLocationChange with lock`, async () => {
        const state = getInitialState({
            suite: {
                locks: [1],
            },
        });
        const store = initStore(state);
        store.dispatch(routerActions.onLocationChange('/'));
        expect(store.getActions().length).toEqual(0);
    });

    it('closeModalApp', () => {
        // @ts-ignore this test is interested only in router.pathname, for better maintainability ignore other properties
        const state = getInitialState({ router: { pathname: '/firmware' } });
        const store = initStore(state);
        // eslint-disable-next-line global-require
        require('next/router').default.pathname = '/accounts/send';
        store.dispatch(routerActions.closeModalApp());
        expect(store.getActions().length).toEqual(2); // unlock + location change
        expect(store.getState().router.app).toEqual('wallet');
        expect(store.getState().router.pathname).toEqual('/accounts/send');
    });
});
