# Drivers (`devtoolstooldiscovery`)

Gated builds of Suite web and Suite desktop answer the Chrome DevTools MCP's `devtoolstooldiscovery`
event with one group of tools, named `suite`: the drivers an agent or a test rig drives the app
through. One app-side contract serves two consumers: an agent exploring a build through
[chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) and the `suite-perf-ab`
rig driving a build through Playwright, which dispatches the same event itself and so keeps its
timing sessions free of any debugger.

The code lives in [`suite/drivers`](../../suite/drivers/README.md). `@trezor/suite` wires it in
[`registerSuiteDrivers.ts`](../../packages/suite/src/support/drivers/registerSuiteDrivers.ts); both
composition roots `import()` that module as a chunk of its own, only when the gate is on, so a real
user's boot bundle carries nothing but the gate and the early perf hook.

## Gate

Two runtime switches have to be on, so the drivers exist in release builds too but never wake up in
a plain e2e run or behind an exposed store alone:

- an automation host: web sets `window.Playwright === true` from an init script before the app
  loads (the e2e suite and the perf rig already do this); desktop exposes
  `window.desktopFlags.exposeStore` from the
  [`--expose-store`](../packages/desktop-app/runtime-flags.md) flag;
- that host's `drivers` flag: `window.drivers === true` from the init script on web, the
  [`--drivers`](../packages/desktop-app/runtime-flags.md) flag on desktop, exposed as
  `window.desktopFlags.drivers`.

An ungated page registers no listener at all: the MCP's listener check finds nothing and nothing
runs. With the gate on, the tools give what `window.store` and `window.TrezorConnect` already give
to e2e tests: full, unredacted state and dispatch. They are not a public API.

## Listing and running the tools

With chrome-devtools-mcp started with `--categoryExperimentalThirdParty=true`,
`list_3p_developer_tools` prints the group and `execute_3p_developer_tool` runs one tool, validating
its arguments with ajv against the tool's JSON Schema (draft-07, rendered from the tool's zod
schema). Results are serialized; a DOM element becomes a uid the MCP can click, and a live object
prints by its type only. In-page code, including `evaluate_script`, can keep results live through
`window.__dtmcp.executeTool(name, params)`.

The listener registers once the drivers' chunk has loaded, shortly after the composition root ran;
a dispatch that gets no answer right after navigation is asked again (the perf rig does so on its
own). Without the MCP, dispatch the event yourself. The answer is synchronous:

```js
const groups = [];
const event = new CustomEvent('devtoolstooldiscovery');
event.respondWith = group => groups.push(group);
window.dispatchEvent(event);

const tools = Object.fromEntries(groups[0].tools.map(tool => [tool.name, tool]));
tools['suite.ready'].execute({}); // { ready, marks, route }
await tools['suite.goto'].execute({ routeName: 'settings-index' });
```

## Tools (v1)

Every tool takes one object argument that its zod schema parses first: a key the schema does not
know is refused, a malformed call throws naming the tool, the key and the problem, and the MCP
reports that as the tool's error. "sync" tools return a value, never a promise; the rig polls those
from synchronous code.

| Tool                    | Input                                                 | Returns                                                                         | sync |
| ----------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------- | ---- |
| `suite.ready`           | `{}`                                                  | `{ ready, marks, route }`                                                       | yes  |
| `suite.build`           | `{}`                                                  | `{ commit, version, suiteType, codesign, driversVersion }`                      | yes  |
| `suite.goto`            | `{ routeName, params?, preserveParams? }`             | `{ route, pathname }`, or `{ route, locked: true }` when navigation is locked   | no   |
| `suite.thunk`           | `{ typePrefix, arg? }`                                | the resolved action of the thunk registered under `typePrefix`                  | no   |
| `suite.dispatch`        | `{ action: { type, payload?, meta?, ... } }`          | `{ ok: true }`; plain actions only, thunks go through `suite.thunk`             | yes  |
| `suite.state`           | `{ path, maxChars? }`                                 | `{ value }` at the dotted path; throws above `maxChars` (default 65536) of JSON | yes  |
| `suite.services`        | `{ name: store \| connect \| desktopApi \| history }` | the live object, for in-page composition                                        | yes  |
| `suite.storageDefaults` | `{}`                                                  | the `@storage/load` payload of an empty database, every key present             | yes  |
| `suite.seed`            | `{ storage, selectedDevice? }`                        | `{ accounts, devices, selectedDevice, filledKeys, unknownKeys }`                | no   |
| `suite.perf`            | `{ action: read \| reset, from?, to? }`               | `{ installed, wrapped, renderers, commits, longTasks }`                         | yes  |
| `suite.testIds`         | `{ prefix?, limit? }`                                 | `{ testIds, total }`                                                            | yes  |
| `suite.find`            | `{ testId, nth? }`                                    | `{ element, count }`                                                            | yes  |

Notes:

- `suite.ready` observes the User Timing marks `@suite/suite-lifecycle` sets: `suite:init` when
  `initThunk` starts, `suite:ready` when it finishes (`onSuiteReady`), `suite:interactive` when the
  loading screen made way for the app (lifecycle ready, router loaded, initial transport wait over).
  `ready` is the interactive mark; `marks` gives each mark's time in `performance.now()`
  milliseconds, or null before it happened, so a consumer can time the boot without the store. The
  marks are plain `performance.mark` entries: traces and DevTools show them, and for sessions with
  analytics consent Sentry's tracing records them as boot spans.
- `suite.thunk` reaches every thunk created with `createThunk` or `createSingleInstanceThunk`, by
  its type prefix, through the registry in `@trezor/redux-utils`. That includes thunks a bundle
  keeps module-internal, which is why the perf rig prefers it to scraping the webpack registry.
- `suite.seed` merges the given slices over `suite.storageDefaults` and dispatches the result as one
  `@storage/load`, then selects `selectedDevice` (a device of `storage.devices`) the way the app
  does; the answer's `selectedDevice` says whether a device is selected afterwards. `filledKeys`
  lists the keys the caller left out; `unknownKeys` the keys no store reads. A seed applied this
  way runs after the store was hydrated from the real database.
- `suite.perf` reads the early perf hook: `earlyPerfHook.ts` is the first item of both webpack
  `main` entries. With the gate on it installs a minimal React DevTools hook before react-dom
  evaluates, or, when another owner got there first (the perf rig's init script on web, the React
  DevTools extension, react-refresh in development builds), wraps that hook's `inject` and
  `onCommitFiberRoot` and keeps calling them; `wrapped` says which. React offers no public API a
  production bundle reports commits through (`<Profiler>` and the performance tracks of React 19.2
  are compiled out of production react-dom), so the DevTools hook protocol, which React DevTools,
  react-refresh and `@trezor/perf-e2e` use as well, is the one channel.
- The group's description carries the drivers version. The perf rig records the tool names and the
  description per side of a comparison and warns when they differ; keep tool changes out of
  performance pull requests.

## Never time through the MCP

The tools exist so the rig and the MCP can drive the app. Numbers still come from the rig's own
probes and CDP thread ticks in sessions without a debugger attached: a page driven through the
DevTools MCP runs with the debugger enabled and measures slower than it is.
