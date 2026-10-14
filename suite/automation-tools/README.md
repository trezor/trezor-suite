# @suite/automation-tools

The `suite` tool group that gated Suite web and desktop builds answer chrome-devtools-mcp's
`devtoolstooldiscovery` event with, and the perf rig dispatches the same event itself. One app-side
contract, two consumers; no UI, no React.

- The contract, the gate and how to call the tools: [docs/tests/automation-tools.md](../../docs/tests/automation-tools.md).
- `createAutomationTools` builds the group from injected dependencies; `packages/suite` wires it
  (`src/support/automation/registerSuiteAutomationTools.ts`) and both composition roots register
  it behind `isAutomationToolsEnabled()`.
- `earlyPerfHook.ts` is the first item of both webpack `main` entries: it installs a minimal React
  DevTools hook before react-dom evaluates, so `suite.perf` can count commits on desktop too.
- Bump `AUTOMATION_TOOLS_VERSION` only when a tool's contract changes; the perf rig records the
  group's description per side and warns when the sides differ.

Tests run under jsdom: `yarn workspace @suite/automation-tools test:unit`.
