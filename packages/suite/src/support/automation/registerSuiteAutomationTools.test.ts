import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { createMemoryHistory } from 'history';

import { TOOL_DISCOVERY_EVENT, type ToolGroup } from '@suite/automation-tools';
import { locksReducer } from '@suite/locks';
import { modalReducer } from '@suite/modal';
import { type GotoThunkDeps, routerReducer } from '@suite/router';
import { mockSuiteRouterHistory } from '@suite/router/mocks';
import { onSuiteReady } from '@suite/suite-lifecycle';
import { type DeviceReducerState, deviceInitialState } from '@suite-common/device';
import { type AccountsRootState } from '@suite-common/wallet-core';

import suiteReducer from 'src/reducers/suite/suiteReducer';
import { createEmptyStoragePayload } from 'src/storage/createEmptyStoragePayload';

import { registerSuiteAutomationTools } from './registerSuiteAutomationTools';

type DiscoveryEvent = CustomEvent & { respondWith?: (group: ToolGroup) => void };

const createTestStore = () => {
    const extra: GotoThunkDeps = { services: { suiteRouterHistory: mockSuiteRouterHistory() } };

    return configureStore({
        reducer: combineReducers({
            suite: suiteReducer,
            router: routerReducer,
            locks: locksReducer,
            modal: modalReducer,
            device: (state: DeviceReducerState = deviceInitialState) => state,
            wallet: (state: AccountsRootState['wallet'] = { accounts: [] }) => state,
        }),
        middleware: getDefaultMiddleware =>
            getDefaultMiddleware({ thunk: { extraArgument: extra }, serializableCheck: false }),
    });
};

const discover = () => {
    const groups: ToolGroup[] = [];
    const event = new CustomEvent(TOOL_DISCOVERY_EVENT) as DiscoveryEvent;
    event.respondWith = group => {
        groups.push(group);
    };
    window.dispatchEvent(event);

    return groups;
};

const getTool = (group: ToolGroup | undefined, name: string) => {
    const tool = group?.tools.find(candidate => candidate.name === name);
    if (!tool) {
        throw new Error(`missing tool ${name}`);
    }

    return tool;
};

describe(registerSuiteAutomationTools.name, () => {
    it('answers the discovery event with the suite group wired to the store and services', async () => {
        const store = createTestStore();
        const history = createMemoryHistory();
        const connect = { getAccountInfo: () => undefined };
        const desktopApi = { appRestart: () => undefined };

        const unregister = registerSuiteAutomationTools({ store, history, connect, desktopApi });
        const [group] = discover();

        expect(group?.name).toBe('suite');
        expect(getTool(group, 'suite.ready').execute({})).toMatchObject({
            ready: false,
            lifecycle: 'initial',
            routerLoaded: false,
        });

        store.dispatch(onSuiteReady());
        await getTool(group, 'suite.goto').execute({ routeName: 'settings-index' });

        expect(getTool(group, 'suite.ready').execute({})).toMatchObject({
            ready: true,
            lifecycle: 'ready',
            routerLoaded: true,
            route: 'settings-index',
        });
        expect(getTool(group, 'suite.services').execute({ name: 'store' })).toBe(store);
        expect(getTool(group, 'suite.services').execute({ name: 'connect' })).toBe(connect);
        expect(getTool(group, 'suite.services').execute({ name: 'desktopApi' })).toBe(desktopApi);
        expect(getTool(group, 'suite.services').execute({ name: 'history' })).toBe(history);
        expect(getTool(group, 'suite.storageDefaults').execute({})).toEqual(
            createEmptyStoragePayload(),
        );

        unregister();

        expect(discover()).toEqual([]);
    });
});
