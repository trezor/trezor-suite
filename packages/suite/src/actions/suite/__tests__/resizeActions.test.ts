import { configureStore } from 'src/support/tests/configureStore';

import resizeReducer, { State as ResizeState } from 'src/reducers/suite/resizeReducer';
import * as resizeActions from 'src/actions/suite/resizeActions';

export const getInitialState = (state?: ResizeState) => ({
    resize: {
        ...resizeReducer(undefined, { type: 'foo' } as any),
        ...state,
    },
});

type State = ReturnType<typeof getInitialState>;
const mockStore = configureStore<State, any>();

const initStore = (state: State) => {
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { resize } = store.getState();
        store.getState().resize = resizeReducer(resize, action);
        // add action back to stack
        store.getActions().push(action);
    });

    return store;
};

describe('Resize Actions', () => {
    it('updateWindowSize', () => {
        process.env.SUITE_TYPE = 'desktop';
        const state = getInitialState();
        const store = initStore(state);

        store.dispatch(resizeActions.updateWindowSize(259, 100));
        expect(store.getState().resize).toEqual({
            size: 'UNAVAILABLE',
            screenWidth: 259,
            screenHeight: 100,
        });

        store.dispatch(resizeActions.updateWindowSize(576, 100));
        expect(store.getState().resize).toEqual({
            size: 'TINY',
            screenWidth: 576,
            screenHeight: 100,
        });

        store.dispatch(resizeActions.updateWindowSize(768, 100));
        expect(store.getState().resize).toEqual({
            size: 'SMALL',
            screenWidth: 768,
            screenHeight: 100,
        });

        store.dispatch(resizeActions.updateWindowSize(992, 100));
        expect(store.getState().resize).toEqual({
            size: 'NORMAL',
            screenWidth: 992,
            screenHeight: 100,
        });

        store.dispatch(resizeActions.updateWindowSize(1200, 100));
        expect(store.getState().resize).toEqual({
            size: 'LARGE',
            screenWidth: 1200,
            screenHeight: 100,
        });

        store.dispatch(resizeActions.updateWindowSize(1201, 100));
        expect(store.getState().resize).toEqual({
            size: 'XLARGE',
            screenWidth: 1201,
            screenHeight: 100,
        });
    });
});
