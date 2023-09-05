import { act } from '@testing-library/react';
import { combineReducers } from 'redux';

import { prepareDiscoveryReducer } from '@suite-common/wallet-core';
import { configureMockStore } from '@suite-common/test-utils';

import { renderWithProviders } from 'src/support/tests/hooksHelper';
import suiteReducer from 'src/reducers/suite/suiteReducer';
import { extraDependencies } from 'src/support/extraDependencies';

import { useDiscovery } from '../useDiscovery';
import { actions } from '../__fixtures__/useDiscovery';

const discoveryReducer = prepareDiscoveryReducer(extraDependencies);

export const getInitialState = (action: any = { type: 'initial' }) => ({
    wallet: {
        discovery: discoveryReducer(undefined, action),
    },
    suite: suiteReducer(undefined, action),
});

const reducer = combineReducers({
    wallet: combineReducers({
        discovery: discoveryReducer,
    }),
    suite: suiteReducer,
});

type State = ReturnType<typeof getInitialState>;
const mockStore = (preloadedState: State) => configureMockStore({ reducer, preloadedState });

const initStore = (state: State) => {
    const store = mockStore(state);

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
        act(() => store.dispatch(a.action));
        const len = renders.length;
        expect(len).toEqual(a.renders); // validate render numbers
        expect(renders[len - 1]).toMatchObject(a.result); // validate hook values
    });

    unmount();
});
