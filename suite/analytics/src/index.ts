export { createAnalytics, type DesktopAnalyticsDep } from './createAnalytics';
export {
    type OnboardingAnalytics,
    type AppUpdateEvent,
    type FirmwareSource,
    AppUpdateEventStatus,
} from './definitions';
export { asTypedDesktopAnalytics } from './asTypedDesktopAnalytics';
export type { AnalyticsDesktopEvents, SuiteReadyPayload } from './analyticsEvents';

export * from './events';
export * as events from './events';

export { type DashboardActivateAssetsModalEventSource } from './events/dashboardActivateAssetsModalEvent';
export { type DashboardReceiveModalEventSource } from './events/dashboardReceiveModalEvent';
export { type DashboardReceiveModalOptionsEventOption } from './events/dashboardReceiveModalOptionsEvent';
export { type DashboardSendModalEventSource } from './events/dashboardSendModalEvent';
export { type DashboardSendModalOptionsEventOption } from './events/dashboardSendModalOptionsEvent';
export { type TransactionCreatedEventAction } from './events/transactionCreatedEvent';
