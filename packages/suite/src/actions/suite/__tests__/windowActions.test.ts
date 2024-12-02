import { configureStore } from 'src/support/tests/configureStore';
import windowReducer, { State as WindowState } from 'src/reducers/suite/windowReducer';
import * as windowActions from 'src/actions/suite/windowActions';

const getInitialState = (state?: WindowState) => ({
    window: {
        ...windowReducer(undefined, { type: 'foo' } as any),
        ...state,
    },
});

type State = ReturnType<typeof getInitialState>;
const mockStore = configureStore<State, any>();

const initStore = (state: State) => {
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { window } = store.getState();
        store.getState().window = windowReducer(window, action);
        // add action back to stack
        store.getActions().push(action);
    });

    return store;
};

describe('Window Actions', () => {
    it('updateWindowSize', () => {
        process.env.SUITE_TYPE = 'desktop';
        const state = getInitialState();
        const store = initStore(state);

        store.dispatch(windowActions.updateWindowSize(259, 100));
        expect(store.getState().window).toEqual({
            size: 'UNAVAILABLE',
            screenWidth: 259,
            screenHeight: 100,
        });

        store.dispatch(windowActions.updateWindowSize(576, 100));
        expect(store.getState().window).toEqual({
            size: 'TINY',
            screenWidth: 576,
            screenHeight: 100,
        });

        store.dispatch(windowActions.updateWindowSize(768, 100));
        expect(store.getState().window).toEqual({
            size: 'SMALL',
            screenWidth: 768,
            screenHeight: 100,
        });

        store.dispatch(windowActions.updateWindowSize(992, 100));
        expect(store.getState().window).toEqual({
            size: 'NORMAL',
            screenWidth: 992,
            screenHeight: 100,
        });

        store.dispatch(windowActions.updateWindowSize(1200, 100));
        expect(store.getState().window).toEqual({
            size: 'LARGE',
            screenWidth: 1200,
            screenHeight: 100,
        });

        store.dispatch(windowActions.updateWindowSize(1201, 100));
        expect(store.getState().window).toEqual({
            size: 'XLARGE',
            screenWidth: 1201,
            screenHeight: 100,
        });
    });
});
