import React from 'react';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProviders } from '@suite/support/tests/hooksHelper';

import discoveryReducer from '@wallet-reducers/discoveryReducer';
import suiteReducer from '@suite-reducers/suiteReducer';
import { useDiscovery } from '../useDiscovery';
import { actions } from '../__fixtures__/useDiscovery';

export const getInitialState = (action: any = { type: 'initial' }) => ({
    wallet: {
        discovery: discoveryReducer(undefined, action),
    },
    suite: suiteReducer(undefined, action),
});

type State = ReturnType<typeof getInitialState>;
const mockStore = configureStore<State, any>([thunk]);

const initStore = (state: State) => {
    const store = mockStore(state);
    store.subscribe(() => {
        const actions = store.getActions();
        const action = actions[actions.length - 1];
        const state = store.getState();
        const { wallet } = state;
        store.getState().wallet = {
            ...wallet,
            discovery: discoveryReducer(wallet.discovery, action),
        };
        store.getState().suite = suiteReducer(state.suite, action);
    });
    return store;
};

type Result = {
    running?: boolean;
    status?: { type: string };
    progress: number;
};

type Callback = (r: Result) => void;

const Component = ({ callback }: { callback: Callback }) => {
    const { isDiscoveryRunning, getDiscoveryStatus, calculateProgress } = useDiscovery();
    callback({
        running: isDiscoveryRunning,
        status: getDiscoveryStatus(),
        progress: calculateProgress(),
    });
    return null;
};

test('useDiscovery', () => {
    const store = initStore(getInitialState());

    const renders: Result[] = [];
    const callback: Callback = r => renders.push(r);

    const { unmount } = renderWithProviders(store, <Component callback={callback} />);

    actions.forEach(a => {
        store.dispatch(a.action);
        const len = renders.length;
        expect(len).toEqual(a.renders); // validate render numbers
        expect(renders[len - 1]).toMatchObject(a.result); // validate hook values
    });

    unmount();
});
