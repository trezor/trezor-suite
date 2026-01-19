export { createLegacyAnalytics, type DesktopLegacyAnalyticsDep } from './createLegacyAnalytics';
export { createAnalytics, type DesktopAnalyticsDep } from './createAnalytics';
export type {
    SuiteAnalyticsEventSuiteReady,
    SuiteDesktopLegacyAnalyticsEvents,
    TransactionCreatedEvent,
} from './types';
export type { OnboardingAnalytics, AppUpdateEvent, FirmwareSource } from './definitions';
export { EventType, AppUpdateEventStatus } from './constants';
export { getTypedDesktopLegacyAnalytics } from './getTypedDesktopLegacyAnalytics';
export { getTypedDesktopAnalytics } from './getTypedDesktopAnalytics';
export type { AnalyticsDesktopEvents } from './analyticsEvents';

export * as events from './events';
