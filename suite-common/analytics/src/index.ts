import { type Analytics } from '@trezor/analytics-uploader';

import { type AnalyticsSharedEvents } from './analyticsEvents';

export { type AnalyticsSharedEvents } from './analyticsEvents';
export {
    type EarnDeviceStatus,
    deviceStatusAttribute,
    getEarnDeviceStatus,
} from './earnAttributes';
export type {
    AnalyticsPlatform,
    AppVersion,
    AttributeDef,
    EventDef,
    EventInstance,
} from './eventDefinition';
export { ANALYTICS_ALLOWED_DOMAINS, validateAnalyticsEventName } from './eventNameValidation';
export type { ValidateEventNameError } from './eventNameValidation';

export * as events from './events';
export { type DeviceOnboardingStepName } from './events/onboardingStepViewedEvent';
export { promoDashboardBannerEvent } from './events/promoDashboardBannerEvent';
export { type ReceiveEntryInteractionAction } from './events/receiveEntryInteractionEvent';

export type AnalyticsDep = {
    analytics: Analytics<AnalyticsSharedEvents>;
};

export {
    transactionCreatedEvent,
    type TransactionCreatedEventAction,
} from './events/transactionCreatedEvent';

export { transactionCancelEvent } from './events/transactionCancelEvent';
export { getTransactionCreatedEventPayload } from './utils/getTransactionCreatedEventPayload';

export { yieldEarnEntryEvent } from './events/yieldEarnEntryEvent';
export { earnTilePressedEvent } from './events/earnTilePressedEvent';
export { stakingNavigateEvent, type StakingNavigateFrom } from './events/stakingNavigateEvent';
export { stakingStakeEvent, type StakingStakeStep } from './events/stakingStakeEvent';
export { stakingUnstakeEvent, type StakingUnstakeStep } from './events/stakingUnstakeEvent';
export { stakingClaimEvent, type StakingClaimStep } from './events/stakingClaimEvent';

export { appFormPercentButtonsEvent } from './events/appFormPercentButtonsEvent';
