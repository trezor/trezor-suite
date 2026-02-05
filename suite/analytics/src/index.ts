export { createAnalytics, type DesktopAnalyticsDep } from './createAnalytics';
export type { OnboardingAnalytics, AppUpdateEvent, FirmwareSource } from './definitions';
export { EventType, AppUpdateEventStatus } from './constants';
export { getTypedDesktopAnalytics } from './getTypedDesktopAnalytics';
export type { AnalyticsDesktopEvents, SuiteReadyPayload } from './analyticsEvents';

export * from './events';
export * as events from './events';

export { type DashboardReceiveModalOptionsEventOption } from './events/dashboardReceiveModalOptionsEvent';
export { type DashboardSendModalOptionsEventOption } from './events/dashboardSendModalOptionsEvent';
export { type TransactionCreatedEventAction } from './events/transactionCreatedEvent';
