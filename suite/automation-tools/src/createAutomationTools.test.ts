import { combineReducers, configureStore } from '@reduxjs/toolkit';

import { lockUI, locksReducer, selectIsRouterOrUiLocked } from '@suite/locks';
import { modalReducer } from '@suite/modal';
import { type GotoThunkDeps, routerReducer } from '@suite/router';
import { mockSuiteRouterHistory } from '@suite/router/mocks';
import { routes } from '@suite/router-config';
import { mock } from '@trezor/dependency-injection';
import { createThunk } from '@trezor/redux-utils';

import {
    AUTOMATION_TOOLS_VERSION,
    type AutomationToolsDeps,
    type SeedStorage,
    createAutomationTools,
} from './createAutomationTools';
import { PERF_HOOK_GLOBAL_KEY, type SuiteAutomationPerfHook } from './perfHook';
import { type DiscoveredTool } from './types';

type PerfWindow = Window & { [PERF_HOOK_GLOBAL_KEY]?: SuiteAutomationPerfHook };
type UserTimingLike = { getEntriesByName?: Performance['getEntriesByName'] };

// jsdom has no User Timing: the lifecycle marks the tools observe come from this stub.
const stubMarks = (startTimes: Record<string, number>) => {
    (performance as UserTimingLike).getEntriesByName = mock<Performance['getEntriesByName']>(
        (name, type) => {
            const startTime = startTimes[name];

            return type === 'mark' && startTime !== undefined
                ? [{ name, entryType: 'mark', startTime, duration: 0, toJSON: () => ({}) }]
                : [];
        },
    );
};

const createTestStore = () => {
    const extra: GotoThunkDeps = { services: { suiteRouterHistory: mockSuiteRouterHistory() } };

    return configureStore({
        reducer: combineReducers({
            router: routerReducer,
            locks: locksReducer,
            modal: modalReducer,
        }),
        middleware: getDefaultMiddleware =>
            getDefaultMiddleware({ thunk: { extraArgument: extra }, serializableCheck: false }),
    });
};

type TestStore = ReturnType<typeof createTestStore>;

const liveServices = {
    connect: { getAccountInfo: () => undefined },
    desktopApi: { appRestart: () => undefined },
    history: { location: { pathname: '/' } },
};

const createDeps = (
    store: TestStore,
    overrides: Partial<AutomationToolsDeps> = {},
): AutomationToolsDeps => ({
    store,
    services: { store, ...liveServices },
    getStorageDefaults: () => ({ accounts: [], devices: [] }),
    seedStorage: mock<SeedStorage>(() =>
        Promise.resolve({
            accounts: 1,
            devices: 1,
            selectedDevice: true,
            filledKeys: [],
            unknownKeys: [],
        }),
    ),
    document,
    ...overrides,
});

const getTool = (deps: AutomationToolsDeps, name: string): DiscoveredTool => {
    const tool = createAutomationTools(deps).tools.find(candidate => candidate.name === name);
    if (!tool) {
        throw new Error(`missing tool ${name}`);
    }

    return tool;
};

const settingsRoute = routes.find(route => route.name === 'settings-index');

const echoThunk = createThunk<{ echoed: unknown }, { value: unknown }, void>(
    '@test/automation/echo',
    ({ value }) => ({ echoed: value }),
);

describe(createAutomationTools.name, () => {
    afterEach(() => {
        document.body.innerHTML = '';
        delete (window as PerfWindow)[PERF_HOOK_GLOBAL_KEY];
        delete (performance as UserTimingLike).getEntriesByName;
    });

    it('describes the versioned group with dotted, unique tools and closed draft-07 schemas', () => {
        const group = createAutomationTools(createDeps(createTestStore()));
        const names = group.tools.map(tool => tool.name);

        expect(group.name).toBe('suite');
        expect(group.description).toBe(
            `Trezor Suite automation tools v${AUTOMATION_TOOLS_VERSION}`,
        );
        expect(names).toEqual([
            'suite.ready',
            'suite.build',
            'suite.goto',
            'suite.thunk',
            'suite.dispatch',
            'suite.state',
            'suite.services',
            'suite.storageDefaults',
            'suite.seed',
            'suite.perf',
            'suite.testIds',
            'suite.find',
        ]);
        expect(new Set(names).size).toBe(names.length);
        group.tools.forEach(tool => {
            expect(tool.inputSchema).toMatchObject({
                $schema: 'http://json-schema.org/draft-07/schema#',
                type: 'object',
                additionalProperties: false,
            });
        });
    });

    it('refuses a call with a key its schema does not know', () => {
        const deps = createDeps(createTestStore());

        expect(() => getTool(deps, 'suite.state').execute({ path: 'router', depth: 1 })).toThrow(
            'suite.state: ✖ Unrecognized key: "depth"',
        );
    });

    describe('suite.ready', () => {
        it('is ready once the interactive lifecycle mark exists and answers every mark', async () => {
            const deps = createDeps(createTestStore());
            stubMarks({});

            expect(getTool(deps, 'suite.ready').execute({})).toEqual({
                ready: false,
                marks: { 'suite:init': null, 'suite:ready': null, 'suite:interactive': null },
                route: null,
            });

            stubMarks({ 'suite:init': 1200.5, 'suite:ready': 3800 });

            expect(getTool(deps, 'suite.ready').execute({})).toMatchObject({
                ready: false,
                marks: { 'suite:init': 1200.5, 'suite:ready': 3800, 'suite:interactive': null },
            });

            stubMarks({ 'suite:init': 1200.5, 'suite:ready': 3800, 'suite:interactive': 4200 });
            await getTool(deps, 'suite.goto').execute({ routeName: 'settings-index' });

            expect(getTool(deps, 'suite.ready').execute({})).toEqual({
                ready: true,
                marks: { 'suite:init': 1200.5, 'suite:ready': 3800, 'suite:interactive': 4200 },
                route: 'settings-index',
            });
        });

        it('is not ready without User Timing', () => {
            const deps = createDeps(createTestStore());

            expect(getTool(deps, 'suite.ready').execute({})).toMatchObject({
                ready: false,
                marks: { 'suite:interactive': null },
            });
        });
    });

    it('suite.build identifies the build and the tools version', () => {
        expect(getTool(createDeps(createTestStore()), 'suite.build').execute({})).toEqual({
            commit: '',
            version: '',
            suiteType: 'desktop',
            codesign: false,
            toolsVersion: AUTOMATION_TOOLS_VERSION,
        });
    });

    describe('suite.goto', () => {
        it('navigates through the router thunk and answers the new route', async () => {
            const deps = createDeps(createTestStore());

            await expect(
                getTool(deps, 'suite.goto').execute({ routeName: 'settings-index' }),
            ).resolves.toEqual({ route: 'settings-index', pathname: settingsRoute?.pattern });
        });

        it('answers locked when navigation is locked', async () => {
            const store = createTestStore();
            const deps = createDeps(store);
            store.dispatch(lockUI(true));

            await expect(
                getTool(deps, 'suite.goto').execute({ routeName: 'settings-index' }),
            ).resolves.toEqual({ route: null, locked: true });
        });

        it('rejects an unknown route', () => {
            const deps = createDeps(createTestStore());

            expect(() => getTool(deps, 'suite.goto').execute({ routeName: 'nowhere' })).toThrow(
                'suite.goto: ✖ unknown route "nowhere"\n  → at routeName',
            );
        });
    });

    describe('suite.thunk', () => {
        it('dispatches a registered thunk by type prefix and answers its resolved action', async () => {
            const deps = createDeps(createTestStore());

            await expect(
                getTool(deps, 'suite.thunk').execute({
                    typePrefix: '@test/automation/echo',
                    arg: { value: 42 },
                }),
            ).resolves.toMatchObject({ type: echoThunk.fulfilled.type, payload: { echoed: 42 } });
        });

        it('takes any JSON value as the argument', () => {
            const { inputSchema } = getTool(createDeps(createTestStore()), 'suite.thunk');

            expect(inputSchema).toMatchObject({ required: ['typePrefix'] });
            expect(inputSchema.properties?.arg).not.toHaveProperty('type');
        });

        it('names the thunks registered under the same namespace for an unknown prefix', () => {
            const deps = createDeps(createTestStore());

            expect(() =>
                getTool(deps, 'suite.thunk').execute({ typePrefix: '@test/automation/missing' }),
            ).toThrow(
                'suite.thunk: no thunk is registered as "@test/automation/missing"; registered under @test/automation/: @test/automation/echo',
            );
        });
    });

    describe('suite.dispatch', () => {
        it('dispatches a plain action, extra keys included', () => {
            const store = createTestStore();
            const deps = createDeps(store);

            expect(
                getTool(deps, 'suite.dispatch').execute({
                    action: { type: lockUI.type, payload: true, meta: { origin: 'test' } },
                }),
            ).toEqual({ ok: true });
            expect(selectIsRouterOrUiLocked(store.getState())).toBe(true);
        });

        it('rejects an action without a type', () => {
            const deps = createDeps(createTestStore());

            expect(() => getTool(deps, 'suite.dispatch').execute({ action: {} })).toThrow(
                /suite\.dispatch: .*→ at action\.type/s,
            );
        });
    });

    describe('suite.state', () => {
        it('reads a dotted path', () => {
            const deps = createDeps(createTestStore());

            expect(getTool(deps, 'suite.state').execute({ path: 'router.loaded' })).toEqual({
                value: false,
            });
            expect(getTool(deps, 'suite.state').execute({ path: 'router.route.name' })).toEqual({
                value: undefined,
            });
        });

        it('refuses a result above maxChars instead of serializing it', () => {
            const deps = createDeps(createTestStore());

            expect(() =>
                getTool(deps, 'suite.state').execute({ path: 'router', maxChars: 10 }),
            ).toThrow(/suite\.state: "router" serializes to \d+ characters, above maxChars 10/);
        });
    });

    it('suite.services hands out the live objects and rejects other names', () => {
        const store = createTestStore();
        const deps = createDeps(store);
        const tool = getTool(deps, 'suite.services');

        expect(tool.execute({ name: 'store' })).toBe(store);
        expect(tool.execute({ name: 'connect' })).toBe(liveServices.connect);
        expect(tool.execute({ name: 'desktopApi' })).toBe(liveServices.desktopApi);
        expect(tool.execute({ name: 'history' })).toBe(liveServices.history);
        expect(() => tool.execute({ name: 'db' })).toThrow(
            /suite\.services: .*expected one of "store"\|"connect"\|"desktopApi"\|"history"/,
        );
    });

    it('suite.storageDefaults answers the injected empty payload', () => {
        expect(getTool(createDeps(createTestStore()), 'suite.storageDefaults').execute({})).toEqual(
            {
                accounts: [],
                devices: [],
            },
        );
    });

    describe('suite.seed', () => {
        it('delegates the slices and the device to the injected seed', async () => {
            const deps = createDeps(createTestStore());
            const storage = { accounts: [] };
            const selectedDevice = { id: 'device' };

            await expect(
                getTool(deps, 'suite.seed').execute({ storage, selectedDevice }),
            ).resolves.toMatchObject({ accounts: 1, devices: 1, selectedDevice: true });
            expect(deps.seedStorage).toHaveBeenCalledWith({ storage, selectedDevice });
        });

        it('requires the storage slices', () => {
            const deps = createDeps(createTestStore());

            expect(() => getTool(deps, 'suite.seed').execute({})).toThrow(
                /suite\.seed: .*→ at storage/s,
            );
        });
    });

    describe('suite.perf', () => {
        it('reports no hook when the early hook did not install', () => {
            const deps = createDeps(createTestStore());

            expect(getTool(deps, 'suite.perf').execute({ action: 'read' })).toEqual({
                installed: false,
                wrapped: false,
                renderers: 0,
                commits: 0,
                longTasks: null,
            });
        });

        it('reads, windows and resets the early hook counts', () => {
            const hook: SuiteAutomationPerfHook = {
                wrapped: true,
                renderers: 1,
                commits: 3,
                commitTimes: [10, 20, 30],
                longTasks: 2,
                reset: mock<SuiteAutomationPerfHook['reset']>(() => undefined),
            };
            (window as PerfWindow)[PERF_HOOK_GLOBAL_KEY] = hook;
            const tool = getTool(createDeps(createTestStore()), 'suite.perf');

            expect(tool.execute({ action: 'read' })).toEqual({
                installed: true,
                wrapped: true,
                renderers: 1,
                commits: 3,
                longTasks: 2,
            });
            expect(tool.execute({ action: 'read', from: 15, to: 25 })).toMatchObject({
                commits: 1,
            });
            expect(tool.execute({ action: 'read', from: 20 })).toMatchObject({ commits: 2 });
            expect(tool.execute({ action: 'reset' })).toMatchObject({
                installed: true,
                commits: 0,
            });
            expect(hook.reset).toHaveBeenCalledTimes(1);
            expect(() => tool.execute({ action: 'clear' })).toThrow(/suite\.perf: .*→ at action/s);
        });
    });

    describe('suite.testIds and suite.find', () => {
        beforeEach(() => {
            document.body.innerHTML = [
                '<div data-testid="@suite/a"></div>',
                '<div data-testid="@suite/a"></div>',
                '<span data-testid="@wallet/b"></span>',
                '<span data-testid=\'say "hi"\'></span>',
            ].join('');
        });

        it('lists distinct test ids, by prefix and limit', () => {
            const tool = getTool(createDeps(createTestStore()), 'suite.testIds');

            expect(tool.execute({})).toEqual({
                testIds: ['@suite/a', '@wallet/b', 'say "hi"'],
                total: 3,
            });
            expect(tool.execute({ prefix: '@wallet' })).toEqual({
                testIds: ['@wallet/b'],
                total: 1,
            });
            expect(tool.execute({ limit: 1 })).toEqual({ testIds: ['@suite/a'], total: 3 });
        });

        it('finds the nth element by test id and counts the matches', () => {
            const tool = getTool(createDeps(createTestStore()), 'suite.find');
            const [first, second] = document.querySelectorAll('[data-testid="@suite/a"]');

            expect(tool.execute({ testId: '@suite/a' })).toEqual({ element: first, count: 2 });
            expect(tool.execute({ testId: '@suite/a', nth: 1 })).toEqual({
                element: second,
                count: 2,
            });
            expect(tool.execute({ testId: 'say "hi"' })).toMatchObject({ count: 1 });
            expect(tool.execute({ testId: '@suite/missing' })).toEqual({ element: null, count: 0 });
        });
    });
});
