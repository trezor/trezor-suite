import { type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';
import { z } from 'zod';

import {
    type GotoThunkDeps,
    type GotoThunkState,
    type Route,
    gotoThunk,
    selectCanNavigate,
    selectRouteName,
    selectRouter,
} from '@suite/router';
import { routes } from '@suite/router-config';
import { SuiteLifecycleMark, getSuiteLifecycleMarkTimes } from '@suite/suite-lifecycle';
import { getCommitHash, getEnvironment, getSuiteVersion, isCodesignBuild } from '@trezor/env-utils';
import { getRegisteredThunk, getRegisteredThunkTypePrefixes } from '@trezor/redux-utils';

import { readPerfHook } from './perfHook';
import { defineTool, toDiscoveredTool } from './toDiscoveredTool';
import { type ToolGroup } from './types';

/** Bumped only when a tool's contract changes; the perf rig compares it between the sides. */
export const DRIVERS_VERSION = 1;
export const DRIVERS_GROUP_NAME = 'suite';

const DEFAULT_STATE_MAX_CHARS = 65_536;
const DEFAULT_TEST_IDS_LIMIT = 200;
const THUNK_HINT_LIMIT = 20;

export const DRIVER_SERVICE_NAMES = ['store', 'connect', 'desktopApi', 'history'] as const;

export type DriverServiceName = (typeof DRIVER_SERVICE_NAMES)[number];

/** Live objects `suite.services` hands out for in-page composition; the tools never call them. */
export type DriverServices = Record<DriverServiceName, unknown>;

export type DriversState = GotoThunkState;

export type DriversStore = {
    getState: () => DriversState;
    dispatch: ThunkDispatch<DriversState, GotoThunkDeps, UnknownAction>;
};

const jsonObject = () => z.record(z.string(), z.unknown());

const seedInputSchema = z.strictObject({
    storage: jsonObject().describe(
        'Slices keyed as @storage/load carries them; the rest comes from the empty defaults.',
    ),
    selectedDevice: jsonObject()
        .optional()
        .describe('A device of storage.devices to select once the payload is applied.'),
});

export type SeedStorageParams = z.output<typeof seedInputSchema>;

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

export type DriversDeps = {
    store: DriversStore;
    services: DriverServices;
    /** The `@storage/load` payload of an empty database, every key present. */
    getStorageDefaults: () => Record<string, unknown>;
    seedStorage: SeedStorage;
    document: Document;
};

export type Drivers = ToolGroup;

const isRouteName = (name: string): name is Route['name'] =>
    routes.some(route => route.name === name);

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
export const createDrivers = (deps: DriversDeps): Drivers => {
    const ready = defineTool({
        name: 'suite.ready',
        description:
            'Whether Suite reached the interactive lifecycle mark; every lifecycle mark (performance.now ms, null before it happened) and the route.',
        inputSchema: z.strictObject({}),
        execute: () => {
            const marks = getSuiteLifecycleMarkTimes();

            return {
                ready: marks[SuiteLifecycleMark.Interactive] !== null,
                marks,
                route: selectRouteName(deps.store.getState()) ?? null,
            };
        },
    });

    const build = defineTool({
        name: 'suite.build',
        description:
            'Identifies the build: commit, version, suite type, codesign and drivers version.',
        inputSchema: z.strictObject({}),
        execute: () => ({
            commit: getCommitHash(),
            version: getSuiteVersion(),
            suiteType: getEnvironment(),
            codesign: isCodesignBuild(),
            driversVersion: DRIVERS_VERSION,
        }),
    });

    const goto = defineTool({
        name: 'suite.goto',
        description:
            'Navigates through the router thunk; answers the route once it changed, or locked when navigation is locked.',
        inputSchema: z.strictObject({
            routeName: z
                .string()
                .refine(isRouteName, { error: issue => `unknown route "${String(issue.input)}"` })
                .describe('A route name from @suite/router-config.'),
            params: jsonObject().optional().describe('Route params, e.g. symbol and accountIndex.'),
            preserveParams: z.boolean().optional(),
        }),
        execute: async ({ routeName, params, preserveParams }) => {
            await deps.store.dispatch(gotoThunk({ routeName, params, preserveParams }));

            const state = deps.store.getState();
            const route = selectRouteName(state) ?? null;
            if (route !== routeName && !selectCanNavigate(state)) {
                return { route, locked: true };
            }

            return { route, pathname: selectRouter(state).pathname };
        },
    });

    const thunk = defineTool({
        name: 'suite.thunk',
        description:
            'Dispatches a thunk registered by createThunk, by type prefix; answers its resolved action.',
        inputSchema: z.strictObject({
            typePrefix: z.string().describe('E.g. @router/goto.'),
            arg: z.unknown().optional().describe('The thunk argument, any JSON value.'),
        }),
        execute: ({ typePrefix, arg }) => {
            const registeredThunk = getRegisteredThunk(typePrefix);
            if (!registeredThunk) {
                throw new Error(
                    `suite.thunk: no thunk is registered as "${typePrefix}"${describeThunkNamespace(typePrefix)}`,
                );
            }

            return deps.store.dispatch(registeredThunk(arg));
        },
    });

    const dispatch = defineTool({
        name: 'suite.dispatch',
        description: 'Dispatches a plain action; thunks go through suite.thunk.',
        inputSchema: z.strictObject({
            action: z.looseObject({
                type: z.string(),
                payload: z.unknown().optional(),
                meta: jsonObject().optional(),
            }),
        }),
        execute: ({ action }) => {
            deps.store.dispatch(action);

            return { ok: true };
        },
    });

    const state = defineTool({
        name: 'suite.state',
        description:
            'Reads a dotted path of the Redux state; refuses results above maxChars (default 65536) of JSON.',
        inputSchema: z.strictObject({
            path: z.string().describe('E.g. router.route.name or wallet.accounts.'),
            maxChars: z.int().positive().optional(),
        }),
        execute: ({ path, maxChars = DEFAULT_STATE_MAX_CHARS }) => {
            const value = readPath(deps.store.getState(), path);
            const chars = JSON.stringify(value)?.length ?? 0;
            if (chars > maxChars) {
                throw new Error(
                    `suite.state: "${path}" serializes to ${chars} characters, above maxChars ${maxChars}; read a narrower path`,
                );
            }

            return { value };
        },
    });

    const services = defineTool({
        name: 'suite.services',
        description:
            'Hands out a live object for in-page composition (window.__dtmcp.executeTool); the MCP prints it by type only.',
        inputSchema: z.strictObject({ name: z.enum(DRIVER_SERVICE_NAMES) }),
        execute: ({ name }) => deps.services[name],
    });

    const storageDefaults = defineTool({
        name: 'suite.storageDefaults',
        description: 'The @storage/load payload of an empty database, with every key present.',
        inputSchema: z.strictObject({}),
        execute: () => deps.getStorageDefaults(),
    });

    const seed = defineTool({
        name: 'suite.seed',
        description:
            'Applies storage slices over the empty defaults as a @storage/load, then selects a device; reports the keys it filled in.',
        inputSchema: seedInputSchema,
        execute: params => deps.seedStorage(params),
    });

    const perf = defineTool({
        name: 'suite.perf',
        description:
            'React commits and long tasks counted by the early perf hook; commits between from and to (performance.now ms) when given.',
        inputSchema: z.strictObject({
            action: z.enum(['read', 'reset']),
            from: z.number().optional(),
            to: z.number().optional(),
        }),
        execute: ({ action, from, to }) => {
            const hook = readPerfHook();
            if (!hook) {
                return {
                    installed: false,
                    wrapped: false,
                    renderers: 0,
                    commits: 0,
                    longTasks: null,
                };
            }
            if (action === 'reset') {
                hook.reset();

                return {
                    installed: true,
                    wrapped: hook.wrapped,
                    renderers: hook.renderers,
                    commits: 0,
                    longTasks: hook.longTasks,
                };
            }
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
                wrapped: hook.wrapped,
                renderers: hook.renderers,
                commits,
                longTasks: hook.longTasks,
            };
        },
    });

    const testIds = defineTool({
        name: 'suite.testIds',
        description: 'Distinct data-testid values on the page, optionally by prefix.',
        inputSchema: z.strictObject({
            prefix: z.string().optional(),
            limit: z.int().nonnegative().optional().describe('Default 200.'),
        }),
        execute: ({ prefix = '', limit = DEFAULT_TEST_IDS_LIMIT }) => {
            const found = new Set<string>();
            deps.document.querySelectorAll('[data-testid]').forEach(element => {
                const testId = element.getAttribute('data-testid');
                if (testId?.startsWith(prefix)) {
                    found.add(testId);
                }
            });

            return { testIds: [...found].slice(0, limit), total: found.size };
        },
    });

    const find = defineTool({
        name: 'suite.find',
        description:
            'The nth element with the data-testid (default the first) and how many there are.',
        inputSchema: z.strictObject({
            testId: z.string(),
            nth: z.int().nonnegative().optional(),
        }),
        execute: ({ testId, nth = 0 }) => {
            const elements = deps.document.querySelectorAll(
                `[data-testid="${escapeAttributeValue(testId)}"]`,
            );

            return { element: elements[nth] ?? null, count: elements.length };
        },
    });

    return {
        name: DRIVERS_GROUP_NAME,
        description: `Trezor Suite drivers v${DRIVERS_VERSION}`,
        tools: [
            toDiscoveredTool(ready),
            toDiscoveredTool(build),
            toDiscoveredTool(goto),
            toDiscoveredTool(thunk),
            toDiscoveredTool(dispatch),
            toDiscoveredTool(state),
            toDiscoveredTool(services),
            toDiscoveredTool(storageDefaults),
            toDiscoveredTool(seed),
            toDiscoveredTool(perf),
            toDiscoveredTool(testIds),
            toDiscoveredTool(find),
        ],
    };
};
