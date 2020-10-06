import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import recoveryReducer from '@recovery-reducers/recoveryReducer';
import { Action } from '@suite-types';
import * as recoveryActions from '@recovery-actions/recoveryActions';

jest.mock('trezor-connect', () => {
    return {
        __esModule: true, // this property makes it work
        default: {
            recoveryDevice: () => {
                return { success: true };
            },
        },
        DEVICE: {
            DISCONNECT: 'device-disconnect',
        },
        TRANSPORT: {},
        BLOCKCHAIN: {},
        UI: {
            REQUEST_BUTTON: 'ui-button',
        },
    };
});

export const getInitialState = (custom?: any): any => {
    return {
        suite: {
            device: {
                features: {
                    // eslint-disable-next-line
                    major_version: 2,
                },
            },
            locks: [],
        },
        recovery: {
            ...recoveryReducer(undefined, {} as Action),
            ...custom,
        },
    };
};

const createStore = (initialState: ReturnType<typeof getInitialState>) => {
    const store = configureStore<ReturnType<typeof getInitialState>, any>([thunk])(initialState);
    return store;
};

const updateStore = (store: ReturnType<typeof createStore>) => {
    // there is not much redux logic in this test
    // just update state on every action manually
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { recovery } = store.getState();

        store.getState().recovery = recoveryReducer(recovery, action);
        // add action back to stack
        store.getActions().push(action);
    });
};

const mockStore = (initialState: ReturnType<typeof getInitialState>) => {
    const store = createStore(initialState);
    store.subscribe(() => updateStore(store));
    return store;
};

describe('Recovery Actions', () => {
    it('setWordsCount', async () => {
        const store = mockStore(getInitialState());

        // default state
        const stateBefore = store.getState().recovery;
        expect(stateBefore.wordsCount).toEqual(12);

        await store.dispatch(recoveryActions.setWordsCount(18));

        const stateAfter = store.getState().recovery;
        expect(stateAfter.wordsCount).toEqual(18);

        // should not trigger side-effect actions
        expect(store.getActions().length).toEqual(1);
    });

    it('setAdvancedRecovery', async () => {
        const store = mockStore(getInitialState());

        // default state
        const stateBefore = store.getState().recovery;
        expect(stateBefore.advancedRecovery).toEqual(false);

        await store.dispatch(recoveryActions.setAdvancedRecovery(true));

        const stateAfter = store.getState().recovery;
        expect(stateAfter.advancedRecovery).toEqual(true);

        // should not trigger side-effect actions
        expect(store.getActions().length).toEqual(1);
    });

    it('setError', () => {
        const store = mockStore(getInitialState());
        store.dispatch(recoveryActions.setStatus('finished'));
        expect(store.getState().recovery.status).toEqual('finished');
    });

    it('resetReducer', () => {
        const store = mockStore(getInitialState());
        store.dispatch(recoveryActions.setStatus('finished'));
        expect(store.getState().recovery.status).toEqual('finished');
        store.dispatch(recoveryActions.resetReducer());
        expect(store.getState().recovery.status).toEqual('initial');
    });

    it('recoverDevice', async () => {
        const store = mockStore(getInitialState());
        const action = store.dispatch(recoveryActions.recoverDevice());
        expect(store.getState().recovery.status).toMatch('in-progress');
        await action;
        expect(store.getState().recovery.status).toMatch('finished');
    });

    it('checkSeed', async () => {
        const store = mockStore(getInitialState());
        const action = store.dispatch(recoveryActions.checkSeed());
        expect(store.getState().recovery.status).toMatch('in-progress');
        await action;
        expect(store.getState().recovery.status).toMatch('finished');
    });
});
