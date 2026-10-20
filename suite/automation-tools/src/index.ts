export {
    AUTOMATION_SERVICE_NAMES,
    AUTOMATION_TOOL_GROUP_NAME,
    AUTOMATION_TOOLS_VERSION,
    type AutomationServiceName,
    type AutomationServices,
    type AutomationTools,
    type AutomationToolsDeps,
    type AutomationToolsState,
    type AutomationStore,
    type SeedStorage,
    type SeedStorageParams,
    type SeedStorageResult,
    createAutomationTools,
} from './createAutomationTools';
export { isAutomationToolsEnabled } from './gate';
export { type SuiteAutomationPerfHook, readPerfHook } from './perfHook';
export { TOOL_DISCOVERY_EVENT, registerToolDiscovery } from './registerToolDiscovery';
export { defineTool, parseToolArgs, toDiscoveredTool } from './toDiscoveredTool';
export type {
    DiscoveredTool,
    Tool,
    ToolGroup,
    ToolInputJsonSchema,
    ToolInputSchema,
} from './types';
