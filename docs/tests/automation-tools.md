# Automation tools (`devtoolstooldiscovery`)

Gated builds of Suite web and Suite desktop answer the Chrome DevTools MCP's `devtoolstooldiscovery`
event with one group of automation tools, named `suite`. One app-side contract serves two consumers:
an agent exploring a build through [chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp)
and the `suite-perf-ab` rig driving a build through Playwright, which dispatches the same event itself
and so keeps its timing sessions free of any debugger.

The code lives in [`suite/automation-tools`](../../suite/automation-tools/README.md). `@trezor/suite`
wires it in [`registerSuiteAutomationTools.ts`](../../packages/suite/src/support/automation/registerSuiteAutomationTools.ts),
and both composition roots register it behind the gate.

## Gate

The gate is a runtime switch, identical on both targets, so the tools exist in release builds too:

- web: `window.Playwright === true`, set by an init script before the app loads. The e2e suite and
  the perf rig already do this.
- desktop: the [`--expose-store`](../packages/desktop-app/runtime-flags.md) flag, which the preload
  exposes as `window.desktopFlags.exposeStore`.

An ungated page registers no listener at all: the MCP's listener check finds nothing and nothing
runs. With the gate on, the tools give what `window.store` and `window.TrezorConnect` already give
to e2e tests: full, unredacted state and dispatch. They are not a public API.

## Listing and running the tools

With chrome-devtools-mcp 1.3.0 started with `--categoryExperimentalThirdParty=true`,
`list_3p_developer_tools` prints the group and `execute_3p_developer_tool` runs one tool, validating
its arguments against the tool's JSON schema. Results are serialized; a DOM element becomes a uid the
MCP can click, and a live object prints by its type only. In-page code, including
`evaluate_script`, can keep results live through `window.__dtmcp.executeTool(name, params)`.

Without the MCP, dispatch the event yourself. The answer is synchronous:

```js
const groups = [];
const event = new CustomEvent('devtoolstooldiscovery');
event.respondWith = group => groups.push(group);
window.dispatchEvent(event);

const tools = Object.fromEntries(groups[0].tools.map(tool => [tool.name, tool]));
tools['suite.ready'].execute({}); // { ready, lifecycle, routerLoaded, route, loadingScreen }
await tools['suite.goto'].execute({ routeName: 'settings-index' });
```

## Tools (v1)

Every tool takes one object argument with `additionalProperties: false`. "sync" tools return a value,
never a promise; the rig polls those from synchronous code. A malformed call throws, which the MCP
reports as the tool's error.

| Tool                    | Input                                                 | Returns                                                                         | sync |
| ----------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------- | ---- |
| `suite.ready`           | `{}`                                                  | `{ ready, lifecycle, routerLoaded, route, loadingScreen }`                      | yes  |
| `suite.build`           | `{}`                                                  | `{ commit, version, suiteType, codesign, toolsVersion }`                        | yes  |
| `suite.goto`            | `{ routeName, params?, preserveParams? }`             | `{ route, pathname }`, or `{ route, locked: true }` when navigation is locked   | no   |
| `suite.thunk`           | `{ typePrefix, arg? }`                                | the resolved action of the thunk registered under `typePrefix`                  | no   |
| `suite.dispatch`        | `{ action: { type, payload?, meta? } }`               | `{ ok: true }`; plain actions only, thunks go through `suite.thunk`             | yes  |
| `suite.state`           | `{ path, maxChars? }`                                 | `{ value }` at the dotted path; throws above `maxChars` (default 65536) of JSON | yes  |
| `suite.services`        | `{ name: store \| connect \| desktopApi \| history }` | the live object, for in-page composition                                        | yes  |
| `suite.storageDefaults` | `{}`                                                  | the `@storage/load` payload of an empty database, every key present             | yes  |
| `suite.seed`            | `{ storage, selectedDevice? }`                        | `{ accounts, devices, selectedDevice, filledKeys, unknownKeys }`                | no   |
| `suite.perf`            | `{ action: read \| reset, from?, to? }`               | `{ installed, renderers, commits, longTasks }`                                  | yes  |
| `suite.testIds`         | `{ prefix?, limit? }`                                 | `{ testIds, total }`                                                            | yes  |
| `suite.find`            | `{ testId, nth? }`                                    | `{ element, count }`                                                            | yes  |

Notes:

- `suite.thunk` reaches every thunk created with `createThunk` or `createSingleInstanceThunk`, by
  its type prefix, through the registry in `@trezor/redux-utils`. That includes thunks a bundle
  keeps module-internal, which is why the perf rig prefers it to scraping the webpack registry.
- `suite.seed` merges the given slices over `suite.storageDefaults` and dispatches the result as one
  `@storage/load`, then selects `selectedDevice` (a device of `storage.devices`) the way the app
  does; the answer's `selectedDevice` says whether a device is selected afterwards. `filledKeys`
  lists the keys the caller left out; `unknownKeys` the keys no store reads. A seed applied this
  way runs after the store was hydrated from the real database.
- `suite.perf` reads the early perf hook: `earlyPerfHook.ts` is the first item of both webpack
  `main` entries and installs a minimal React DevTools hook before react-dom evaluates, when the
  gate is on and no hook exists yet. When another hook got there first (the perf rig's init script
  on web, the React DevTools extension), `installed` is `false` and that hook's owner counts.
- The group's description carries the tools version. The perf rig records the tool names and the
  description per side of a comparison and warns when they differ; keep tool changes out of
  performance pull requests.

## Never time through the MCP

The tools exist so the rig and the MCP can drive the app. Numbers still come from the rig's own
probes and CDP thread ticks in sessions without a debugger attached: a page driven through the
DevTools MCP runs with the debugger enabled and measures slower than it is.
