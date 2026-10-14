import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { createMemoryHistory } from 'history';

import { TOOL_DISCOVERY_EVENT, type ToolGroup } from '@suite/automation-tools';
import { locksReducer } from '@suite/locks';
import { modalReducer } from '@suite/modal';
import { type GotoThunkDeps, routerReducer } from '@suite/router';
import { mockSuiteRouterHistory } from '@suite/router/mocks';
import { type DeviceReducerState, deviceInitialState } from '@suite-common/device';
import { type AccountsRootState } from '@suite-common/wallet-core';
import { isCodesignBuild } from '@trezor/env-utils';

import { createEmptyStoragePayload } from '#src/storage/createEmptyStoragePayload';

import { registerSuiteAutomationTools } from './registerSuiteAutomationTools';

jest.mock('@trezor/env-utils', () => ({
    ...jest.requireActual('@trezor/env-utils'),
    isCodesignBuild: jest.fn(),
}));

type DiscoveryEvent = CustomEvent & { respondWith?: (group: ToolGroup) => void };
type FlagsWindow = Window & { automationTools?: unknown };

const flagsWindow = window as FlagsWindow;

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

describe(registerSuiteAutomationTools.name, () => {
    beforeEach(() => {
        flagsWindow.automationTools = true;
    });

    afterEach(() => {
        delete flagsWindow.automationTools;
    });

    describe('in a codesigned build', () => {
        beforeEach(() => {
            jest.mocked(isCodesignBuild).mockReturnValue(true);
        });

        it('answers no discovery event even with the switch on', () => {
            const unregister = registerSuiteAutomationTools(createDeps());

            expect(discover()).toEqual([]);

            unregister();
        });
    });

    describe('in a build that is not codesigned', () => {
        beforeEach(() => {
            jest.mocked(isCodesignBuild).mockReturnValue(false);
        });

        it('answers the discovery event with the suite group wired to the store and services', async () => {
            const deps = createDeps();
            const { store, history, connect, desktopApi } = deps;

            const unregister = registerSuiteAutomationTools(deps);
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
            expect(getTool(group, 'suite.services').execute({ name: 'desktopApi' })).toBe(
                desktopApi,
            );
            expect(getTool(group, 'suite.services').execute({ name: 'history' })).toBe(history);
            expect(getTool(group, 'suite.storageDefaults').execute({})).toEqual(
                createEmptyStoragePayload(),
            );

            unregister();

            expect(discover()).toEqual([]);
        });
    });
});
