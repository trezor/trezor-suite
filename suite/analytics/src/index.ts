export { createAnalytics, type DesktopAnalyticsDep } from './createAnalytics';
export {
    type OnboardingAnalytics,
    type AppUpdateEvent,
    type FirmwareSource,
    AppUpdateEventStatus,
} from './definitions';
export { EventType } from './constants';
export { asTypedDesktopAnalytics } from './asTypedDesktopAnalytics';
export type { AnalyticsDesktopEvents, SuiteReadyPayload } from './analyticsEvents';

export * from './events';
export * as events from './events';

export { type DashboardReceiveModalOptionsEventOption } from './events/dashboardReceiveModalOptionsEvent';
export { type DashboardSendModalOptionsEventOption } from './events/dashboardSendModalOptionsEvent';
export { type TransactionCreatedEventAction } from './events/transactionCreatedEvent';
