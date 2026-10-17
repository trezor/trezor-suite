# @suite/drivers

The `suite` tool group that gated Suite web and desktop builds answer chrome-devtools-mcp's
`devtoolstooldiscovery` event with, and the perf rig dispatches the same event itself: the drivers an
agent or a test rig drives the app through. One app-side contract, two consumers; no UI, no React.

- The contract, the gate and how to call the tools: [docs/tests/drivers.md](../../docs/tests/drivers.md).
- `createDrivers` builds the group from injected dependencies. Each tool is defined with a zod input
  schema (`defineTool`), which types its arguments and renders as the JSON Schema the MCP validates
  calls against (`toDiscoveredTool`). `packages/suite` wires it in
  `src/support/drivers/registerSuiteDrivers.ts`; both composition roots `import()` that module
  behind `isDriversEnabled()`, so a real user's boot bundle carries only the gate.
- `earlyPerfHook.ts` is the first item of both webpack `main` entries: it installs a minimal React
  DevTools hook before react-dom evaluates, or wraps the one already there, so `suite.perf` can count
  commits on desktop too.
- Bump `DRIVERS_VERSION` only when a tool's contract changes; the perf rig records the group's
  description per side and warns when the sides differ.

Tests run under jsdom: `yarn workspace @suite/drivers test:unit`.
