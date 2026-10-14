# @suite/automation-tools

The `suite` tool group that gated Suite web and desktop builds answer chrome-devtools-mcp's
`devtoolstooldiscovery` event with: the automation tools an AI agent or a test harness drives the
app through. Any harness can dispatch the same event itself; the `suite-perf-ab` perf rig does so
from Playwright to keep its timing sessions free of a debugger. One app-side contract for every
consumer; no UI, no React.

- The contract, the gate and how to call the tools:
  [docs/tests/automation-tools.md](../../docs/tests/automation-tools.md).
- `createAutomationTools` builds the group from injected dependencies. Each tool is defined with a
  zod input schema (`defineTool`), which types its arguments and renders as the JSON Schema the MCP
  validates calls against (`toDiscoveredTool`). `packages/suite` wires it in
  `src/support/automation/registerSuiteAutomationTools.ts`; both composition roots `import()` that
  module behind `isAutomationToolsEnabled()`, so a real user's boot bundle carries only the gate.
- `earlyPerfHook.ts` is the first item of both webpack `main` entries: it installs a minimal React
  DevTools hook before react-dom evaluates, or wraps the one already there, so `suite.perf` can count
  commits on desktop too.
- Bump `AUTOMATION_TOOLS_VERSION` only when a tool's contract changes; consumers that compare
  builds read the group's description per side and warn when the sides differ.

Tests run under jsdom: `yarn workspace @suite/automation-tools test:unit`.
