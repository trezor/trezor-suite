export { type AnalyticsSharedEvents } from './analyticsEvents';
export type { AttributeDef, EventDef, EventInstance, AppVersion } from './eventDefinition';
export {
    ANALYTICS_ALLOWED_DOMAINS,
    ANALYTICS_EVENT_NAME_KEBAB_SEGMENT,
    isValidEventPart,
    validateAnalyticsEventName,
} from './eventNameValidation';
export type { AnalyticsDomain, ValidateEventNameError } from './eventNameValidation';

export * as events from './events';
