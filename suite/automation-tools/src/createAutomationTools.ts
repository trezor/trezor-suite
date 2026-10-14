import { type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';

import {
    type GotoThunkDeps,
    type GotoThunkState,
    type Route,
    gotoThunk,
    selectCanNavigate,
    selectRouteName,
    selectRouter,
    selectRouterLoaded,
} from '@suite/router';
import { routes } from '@suite/router-config';
import { getCommitHash, getEnvironment, getSuiteVersion, isCodesignBuild } from '@trezor/env-utils';
import { getRegisteredThunk, getRegisteredThunkTypePrefixes } from '@trezor/redux-utils';

import { readPerfHook } from './perfHook';
import {
    readOptionalBoolean,
    readOptionalNumber,
    readOptionalObject,
    readOptionalString,
    readRequiredObject,
    readRequiredString,
} from './toolArgs';
import { type JsonSchema, type Tool, type ToolGroup, type ToolInputSchema } from './types';

/** Bumped only when a tool's contract changes; the perf rig compares it between the sides. */
export const AUTOMATION_TOOLS_VERSION = 1;
export const AUTOMATION_TOOL_GROUP_NAME = 'suite';

const LOADING_SCREEN_TEST_ID = '@suite/loading';
const DEFAULT_STATE_MAX_CHARS = 65_536;
const DEFAULT_TEST_IDS_LIMIT = 200;
const THUNK_HINT_LIMIT = 20;

export const AUTOMATION_SERVICE_NAMES = ['store', 'connect', 'desktopApi', 'history'] as const;

export type AutomationServiceName = (typeof AUTOMATION_SERVICE_NAMES)[number];

/** Live objects `suite.services` hands out for in-page composition; the tools never call them. */
export type AutomationServices = Record<AutomationServiceName, unknown>;

export type AutomationToolsState = GotoThunkState;

export type AutomationStore = {
    getState: () => AutomationToolsState;
    dispatch: ThunkDispatch<AutomationToolsState, GotoThunkDeps, UnknownAction>;
};

export type SeedStorageParams = {
    /** Slices keyed as `@storage/load` carries them; the rest comes from the empty defaults. */
    storage: Record<string, unknown>;
    /** A device of `storage.devices` to select once the payload is applied. */
    selectedDevice?: object;
};

export type SeedStorageResult = {
    accounts: number;
    devices: number;
    /** Whether a device is selected once the seed is applied. */
    selectedDevice: boolean;
    /** Keys the caller left out, so a scenario sees what it implicitly relies on. */
    filledKeys: string[];
    /** Keys no store of this build reads; a mistyped slice no longer no-ops silently. */
    unknownKeys: string[];
};

export type SeedStorage = (params: SeedStorageParams) => Promise<SeedStorageResult>;

export type AutomationToolsDeps = {
    store: AutomationStore;
    services: AutomationServices;
    getLifecycleStatus: () => string;
    /** The `@storage/load` payload of an empty database, every key present. */
    getStorageDefaults: () => Record<string, unknown>;
    seedStorage: SeedStorage;
    document: Document;
};

export type AutomationTools = ToolGroup;

const inputSchema = (
    properties: Record<string, JsonSchema>,
    required?: string[],
): ToolInputSchema => ({
    type: 'object',
    properties,
    ...(required && required.length > 0 ? { required } : {}),
    additionalProperties: false,
});

const isRouteName = (name: string): name is Route['name'] =>
    routes.some(route => route.name === name);

const isServiceName = (name: string): name is AutomationServiceName =>
    AUTOMATION_SERVICE_NAMES.some(serviceName => serviceName === name);

const readPath = (root: unknown, path: string): unknown =>
    path === ''
        ? root
        : path.split('.').reduce<unknown>((value, key) => {
              if (typeof value !== 'object' || value === null) {
                  return undefined;
              }

              return (value as Record<string, unknown>)[key];
          }, root);

const describeThunkNamespace = (typePrefix: string) => {
    const namespace = typePrefix.slice(0, typePrefix.lastIndexOf('/') + 1);
    const siblings = getRegisteredThunkTypePrefixes().filter(prefix =>
        prefix.startsWith(namespace),
    );
    if (namespace === '' || siblings.length === 0) {
        return '';
    }
    const shown = siblings.slice(0, THUNK_HINT_LIMIT).join(', ');
    const more = siblings.length > THUNK_HINT_LIMIT ? `, … (${siblings.length} total)` : '';

    return `; registered under ${namespace}: ${shown}${more}`;
};

const escapeAttributeValue = (value: string) => value.replace(/["\\]/g, '\\$&');

/**
 * The `suite` tool group (v1) that gated Suite builds answer `devtoolstooldiscovery` with: what
 * the perf rig and an agent on chrome-devtools-mcp drive the app through. Tools marked sync in
 * the docs return a value, never a promise, because the rig polls them from synchronous code.
 */
export const createAutomationTools = (deps: AutomationToolsDeps): AutomationTools => {
    const ready: Tool = {
        name: 'suite.ready',
        description:
            'Whether Suite finished initializing: lifecycle status, router state and the loading screen.',
        inputSchema: inputSchema({}),
        execute: () => {
            const state = deps.store.getState();
            const lifecycle = deps.getLifecycleStatus();
            const routerLoaded = selectRouterLoaded(state);
            const loadingScreen =
                deps.document.querySelector(`[data-testid="${LOADING_SCREEN_TEST_ID}"]`) !== null;

            return {
                ready: lifecycle === 'ready' && routerLoaded && !loadingScreen,
                lifecycle,
                routerLoaded,
                route: selectRouteName(state) ?? null,
                loadingScreen,
            };
        },
    };

    const build: Tool = {
        name: 'suite.build',
        description:
            'Identifies the build: commit, version, suite type, codesign and tools version.',
        inputSchema: inputSchema({}),
        execute: () => ({
            commit: getCommitHash(),
            version: getSuiteVersion(),
            suiteType: getEnvironment(),
            codesign: isCodesignBuild(),
            toolsVersion: AUTOMATION_TOOLS_VERSION,
        }),
    };

    const goto: Tool = {
        name: 'suite.goto',
        description:
            'Navigates through the router thunk; answers the route once it changed, or locked when navigation is locked.',
        inputSchema: inputSchema(
            {
                routeName: {
                    type: 'string',
                    description: 'A route name from @suite/router-config.',
                },
                params: {
                    type: 'object',
                    description: 'Route params, e.g. symbol and accountIndex.',
                },
                preserveParams: { type: 'boolean' },
            },
            ['routeName'],
        ),
        execute: async args => {
            const routeName = readRequiredString(args, 'routeName', goto.name);
            if (!isRouteName(routeName)) {
                throw new Error(`${goto.name}: unknown route "${routeName}"`);
            }
            const params = readOptionalObject(args, 'params', goto.name);
            const preserveParams = readOptionalBoolean(args, 'preserveParams', goto.name);

            await deps.store.dispatch(gotoThunk({ routeName, params, preserveParams }));

            const state = deps.store.getState();
            const route = selectRouteName(state) ?? null;
            if (route !== routeName && !selectCanNavigate(state)) {
                return { route, locked: true };
            }

            return { route, pathname: selectRouter(state).pathname };
        },
    };

    const thunk: Tool = {
        name: 'suite.thunk',
        description:
            'Dispatches a thunk registered by createThunk, by type prefix; answers its resolved action.',
        inputSchema: inputSchema(
            {
                typePrefix: { type: 'string', description: 'E.g. @router/goto.' },
                arg: { type: 'object', description: 'The thunk argument.' },
            },
            ['typePrefix'],
        ),
        execute: args => {
            const typePrefix = readRequiredString(args, 'typePrefix', thunk.name);
            const registeredThunk = getRegisteredThunk(typePrefix);
            if (!registeredThunk) {
                throw new Error(
                    `${thunk.name}: no thunk is registered as "${typePrefix}"${describeThunkNamespace(typePrefix)}`,
                );
            }

            return deps.store.dispatch(registeredThunk(args.arg));
        },
    };

    const dispatch: Tool = {
        name: 'suite.dispatch',
        description: 'Dispatches a plain action; thunks go through suite.thunk.',
        inputSchema: inputSchema(
            {
                action: {
                    type: 'object',
                    properties: {
                        type: { type: 'string' },
                        payload: {},
                        meta: { type: 'object' },
                    },
                    required: ['type'],
                },
            },
            ['action'],
        ),
        execute: args => {
            const action = readRequiredObject(args, 'action', dispatch.name);
            const type = readRequiredString(action, 'type', dispatch.name);

            deps.store.dispatch({ ...action, type });

            return { ok: true };
        },
    };

    const state: Tool = {
        name: 'suite.state',
        description:
            'Reads a dotted path of the Redux state; refuses results above maxChars (default 65536) of JSON.',
        inputSchema: inputSchema(
            {
                path: { type: 'string', description: 'E.g. router.route.name or wallet.accounts.' },
                maxChars: { type: 'integer' },
            },
            ['path'],
        ),
        execute: args => {
            const path = readRequiredString(args, 'path', state.name);
            const maxChars =
                readOptionalNumber(args, 'maxChars', state.name) ?? DEFAULT_STATE_MAX_CHARS;
            const value = readPath(deps.store.getState(), path);
            const chars = JSON.stringify(value)?.length ?? 0;
            if (chars > maxChars) {
                throw new Error(
                    `${state.name}: "${path}" serializes to ${chars} characters, above maxChars ${maxChars}; read a narrower path`,
                );
            }

            return { value };
        },
    };

    const services: Tool = {
        name: 'suite.services',
        description:
            'Hands out a live object for in-page composition (window.__dtmcp.executeTool); the MCP prints it by type only.',
        inputSchema: inputSchema(
            { name: { type: 'string', enum: [...AUTOMATION_SERVICE_NAMES] } },
            ['name'],
        ),
        execute: args => {
            const name = readRequiredString(args, 'name', services.name);
            if (!isServiceName(name)) {
                throw new Error(
                    `${services.name}: unknown service "${name}"; one of ${AUTOMATION_SERVICE_NAMES.join(', ')}`,
                );
            }

            return deps.services[name];
        },
    };

    const storageDefaults: Tool = {
        name: 'suite.storageDefaults',
        description: 'The @storage/load payload of an empty database, with every key present.',
        inputSchema: inputSchema({}),
        execute: () => deps.getStorageDefaults(),
    };

    const seed: Tool = {
        name: 'suite.seed',
        description:
            'Applies storage slices over the empty defaults as a @storage/load, then selects a device; reports the keys it filled in.',
        inputSchema: inputSchema(
            {
                storage: { type: 'object' },
                selectedDevice: { type: 'object' },
            },
            ['storage'],
        ),
        execute: args =>
            deps.seedStorage({
                storage: readRequiredObject(args, 'storage', seed.name),
                selectedDevice: readOptionalObject(args, 'selectedDevice', seed.name),
            }),
    };

    const perf: Tool = {
        name: 'suite.perf',
        description:
            'React commits and long tasks counted by the early perf hook; commits between from and to (performance.now ms) when given.',
        inputSchema: inputSchema(
            {
                action: { type: 'string', enum: ['read', 'reset'] },
                from: { type: 'number' },
                to: { type: 'number' },
            },
            ['action'],
        ),
        execute: args => {
            const action = readRequiredString(args, 'action', perf.name);
            if (action !== 'read' && action !== 'reset') {
                throw new Error(`${perf.name}: "action" must be read or reset`);
            }
            const hook = readPerfHook();
            if (!hook) {
                return { installed: false, renderers: 0, commits: 0, longTasks: null };
            }
            if (action === 'reset') {
                hook.reset();

                return {
                    installed: true,
                    renderers: hook.renderers,
                    commits: 0,
                    longTasks: hook.longTasks,
                };
            }
            const from = readOptionalNumber(args, 'from', perf.name);
            const to = readOptionalNumber(args, 'to', perf.name);
            const commits =
                from === undefined && to === undefined
                    ? hook.commits
                    : hook.commitTimes.filter(
                          time =>
                              (from === undefined || time >= from) &&
                              (to === undefined || time < to),
                      ).length;

            return {
                installed: true,
                renderers: hook.renderers,
                commits,
                longTasks: hook.longTasks,
            };
        },
    };

    const testIds: Tool = {
        name: 'suite.testIds',
        description: 'Distinct data-testid values on the page, optionally by prefix.',
        inputSchema: inputSchema({
            prefix: { type: 'string' },
            limit: { type: 'integer', description: 'Default 200.' },
        }),
        execute: args => {
            const prefix = readOptionalString(args, 'prefix', testIds.name) ?? '';
            const limit = readOptionalNumber(args, 'limit', testIds.name) ?? DEFAULT_TEST_IDS_LIMIT;
            const found = new Set<string>();
            deps.document.querySelectorAll('[data-testid]').forEach(element => {
                const testId = element.getAttribute('data-testid');
                if (testId?.startsWith(prefix)) {
                    found.add(testId);
                }
            });

            return { testIds: [...found].slice(0, limit), total: found.size };
        },
    };

    const find: Tool = {
        name: 'suite.find',
        description:
            'The nth element with the data-testid (default the first) and how many there are.',
        inputSchema: inputSchema(
            {
                testId: { type: 'string' },
                nth: { type: 'integer' },
            },
            ['testId'],
        ),
        execute: args => {
            const testId = readRequiredString(args, 'testId', find.name);
            const nth = readOptionalNumber(args, 'nth', find.name) ?? 0;
            const elements = deps.document.querySelectorAll(
                `[data-testid="${escapeAttributeValue(testId)}"]`,
            );

            return { element: elements[nth] ?? null, count: elements.length };
        },
    };

    return {
        name: AUTOMATION_TOOL_GROUP_NAME,
        description: `Trezor Suite automation tools v${AUTOMATION_TOOLS_VERSION}`,
        tools: [
            ready,
            build,
            goto,
            thunk,
            dispatch,
            state,
            services,
            storageDefaults,
            seed,
            perf,
            testIds,
            find,
        ],
    };
};
