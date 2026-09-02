import { type Analytics } from '@trezor/analytics-uploader';

import { type AnalyticsSharedEvents } from './analyticsEvents';

export { type AnalyticsSharedEvents } from './analyticsEvents';
export type {
    AttributeDef,
    EventDef,
    EventInstance,
    AppVersion,
    AnalyticsPlatform,
} from './eventDefinition';
export { ANALYTICS_ALLOWED_DOMAINS, validateAnalyticsEventName } from './eventNameValidation';
export type { ValidateEventNameError } from './eventNameValidation';

export * as events from './events';
export { type DeviceOnboardingStepName } from './events/onboardingStepViewedEvent';
export { promoDashboardBannerEvent } from './events/promoDashboardBannerEvent';

export type AnalyticsDep = {
    analytics: Analytics<AnalyticsSharedEvents>;
};
