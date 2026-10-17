import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { createMemoryHistory } from 'history';

import { TOOL_DISCOVERY_EVENT, type ToolGroup } from '@suite/drivers';
import { locksReducer } from '@suite/locks';
import { modalReducer } from '@suite/modal';
import { type GotoThunkDeps, routerReducer } from '@suite/router';
import { mockSuiteRouterHistory } from '@suite/router/mocks';
import { type DeviceReducerState, deviceInitialState } from '@suite-common/device';
import { type AccountsRootState } from '@suite-common/wallet-core';

import { createEmptyStoragePayload } from 'src/storage/createEmptyStoragePayload';

import { registerSuiteDrivers } from './registerSuiteDrivers';

type DiscoveryEvent = CustomEvent & { respondWith?: (group: ToolGroup) => void };

const createTestStore = () => {
    const extra: GotoThunkDeps = { services: { suiteRouterHistory: mockSuiteRouterHistory() } };

    return configureStore({
        reducer: combineReducers({
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

const createDeps = () => ({
    store: createTestStore(),
    history: createMemoryHistory(),
    connect: { getAccountInfo: () => undefined },
    desktopApi: { appRestart: () => undefined },
});

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

describe(registerSuiteDrivers.name, () => {
    it('answers the discovery event with the suite group wired to the store and services', async () => {
        const deps = createDeps();
        const { store, history, connect, desktopApi } = deps;

        const unregister = registerSuiteDrivers(deps);
        const [group] = discover();

        expect(group?.name).toBe('suite');
        expect(getTool(group, 'suite.ready').execute({})).toEqual({
            ready: false,
            marks: { 'suite:init': null, 'suite:ready': null, 'suite:interactive': null },
            route: null,
        });

        await getTool(group, 'suite.goto').execute({ routeName: 'settings-index' });

        expect(getTool(group, 'suite.ready').execute({})).toMatchObject({
            ready: false,
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
