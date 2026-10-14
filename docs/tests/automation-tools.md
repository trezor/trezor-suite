# Automation tools (`devtoolstooldiscovery`)

Gated Suite web and desktop builds answer the Chrome DevTools MCP's `devtoolstooldiscovery` event
with one group of tools, named `suite`.
These are the automation tools an AI agent or a test harness drives the app through.
One app-side contract serves every consumer:
an agent exploring a build through
[chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp),
and any Playwright or CDP harness that dispatches the same event itself, with no debugger attached.

The code lives in [`suite/automation-tools`](../../suite/automation-tools/README.md).
`@trezor/suite` wires it in
[`registerSuiteAutomationTools.ts`](../../packages/suite/src/support/automation/registerSuiteAutomationTools.ts).
Both composition roots call `loadSuiteAutomationTools`,
which `import()`s that module as a chunk of its own, only when the gate is on.
A real user's boot bundle therefore carries nothing but the gate and the early perf hook.

## Gate

The tools ship in every build except codesigned releases (`IS_CODESIGN_BUILD="true"`),
which are the builds users download: there the gate is always off.
Every other build keeps them, production builds included,
so a harness or an agent can debug and profile a production build.
One runtime switch turns them on:

- web: `window.automationTools === true`, set from an init script before the app loads;
- desktop: the [`--automation-tools`](../packages/desktop-app/runtime-flags.md) flag,
  exposed by the preload as `window.desktopFlags.automationTools`.

An ungated page never requests the chunk and registers no listener at all:
the MCP's listener check finds nothing and nothing runs.
Unit tests hold this for codesigned builds at each step:
the gate, the loader, the listener registration and the early perf hook.
With the gate on, the tools give full, unredacted state and dispatch,
as `window.store` and `window.TrezorConnect` already do for e2e tests.
They are not a public API.

## Listing and running the tools

Start chrome-devtools-mcp with `--categoryExperimentalThirdParty=true`.
`list_3p_developer_tools` then prints the group and `execute_3p_developer_tool` runs one tool.
The MCP validates the arguments with ajv against the tool's JSON Schema
(draft-07, rendered from the tool's zod schema).
Results are serialized: a DOM element becomes a uid the MCP can click,
and a live object prints by its type only.
In-page code, including `evaluate_script`,
can keep results live through `window.__dtmcp.executeTool(name, params)`.

The listener registers once the automation tools' chunk has loaded,
shortly after the composition root ran.
A dispatch that gets no answer right after navigation should be asked again.
Without the MCP, dispatch the event yourself.
The answer is synchronous:

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

Every tool takes one object argument that its zod schema parses first.
A key the schema does not know is refused.
A malformed call throws naming the tool, the key and the problem,
and the MCP reports that as the tool's error.
"sync" tools return a value, never a promise, so synchronous in-page code can poll them.

| Tool                    | Input                                                 | Returns                                                                         | sync |
| ----------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------- | ---- |
| `suite.ready`           | `{}`                                                  | `{ ready, marks, route }`                                                       | yes  |
| `suite.build`           | `{}`                                                  | `{ commit, version, suiteType, codesign, toolsVersion }`                        | yes  |
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

- `suite.ready` reads the [lifecycle marks](#lifecycle-marks).
  `ready` is true once `suite:interactive` is set.
  `marks` gives each mark's time in `performance.now()` milliseconds, or null before it happened,
  so a consumer can time the boot without the store.
- `suite.thunk` reaches every thunk created with `createThunk` or `createSingleInstanceThunk`,
  by its type prefix, through the registry in `@trezor/redux-utils`.
  That includes thunks a bundle keeps module-internal,
  so no consumer has to scrape the webpack module registry.
- `suite.seed` merges the given slices over `suite.storageDefaults`
  and dispatches the result as one `@storage/load`.
  It then selects `selectedDevice` (a device of `storage.devices`) the way the app does;
  the answer's `selectedDevice` says whether a device is selected afterwards.
  `filledKeys` lists the keys the caller left out; `unknownKeys` the keys no store reads.
  The store was already hydrated from the real database, so seed a fresh profile:
  `@storage/load` replaces some slices (devices, accounts) but merges others
  (transactions, send form drafts), and it keeps the selected device.
- `suite.perf` reads the early perf hook:
  `earlyPerfHook.ts` is the first item of both webpack `main` entries.
  With the gate on it installs a minimal React DevTools hook before react-dom evaluates.
  When another owner got there first
  (a harness's init script on web, the React DevTools extension, react-refresh in dev builds),
  it wraps that hook's `inject` and `onCommitFiberRoot` and keeps calling them;
  `wrapped` says which.
  React offers no public API a production bundle reports commits through:
  `<Profiler>` and the performance tracks of React 19.2 are compiled out of production react-dom.
  So the DevTools hook protocol is the one channel;
  React DevTools, react-refresh and `@trezor/perf-e2e` use it as well.
- The group's description carries the tools version.
  A consumer that compares two builds can record the tool names and the description per side
  and warn when they differ.
  Keep tool changes out of performance pull requests.

## Lifecycle marks

`@suite/suite-lifecycle` sets three User Timing marks
([`suiteLifecycleMarks.ts`](../../suite/suite-lifecycle/src/suiteLifecycleMarks.ts)).
Readers take the first entry of each.

| Mark                | Set when                   | Meaning                                                                                                                            |
| ------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `suite:init`        | `initThunk` starts         | The store is hydrated and the analytics consent is answered. A fresh profile stays before this mark until the consent is answered. |
| `suite:ready`       | `initThunk` finishes       | Connect and the backends are up; `onSuiteReady` is dispatched.                                                                     |
| `suite:interactive` | the loading screen is gone | The app is shown: lifecycle ready, router loaded, initial transport wait over.                                                     |

They are plain `performance.mark` entries with constant names and no data.
Traces and DevTools show them,
and for sessions with analytics consent Sentry's tracing records them as boot spans.

## Never time through the MCP

The tools exist so an agent or a harness can drive the app.
Timing numbers still have to come from a harness's own probes and CDP thread ticks,
in sessions without a debugger attached.
A page driven through the DevTools MCP runs with the debugger enabled
and measures slower than it is.
