import { type AnalyticsSharedEvents, events as sharedEvents } from '@suite-common/analytics';
import { type Analytics } from '@trezor/analytics-uploader';

export type SuiteSyncAnalytics = Pick<Analytics<AnalyticsSharedEvents>, 'report'>;

export type SuiteSyncAnalyticsDep = {
    analytics?: SuiteSyncAnalytics;
};

export type LabelEntityType = 'wallet' | 'account' | 'receive_address' | 'output';
export type LabelAction = 'created' | 'edited';

export const getLabelAction = (previousLabel: string | null): LabelAction =>
    previousLabel ? 'edited' : 'created';

export const reportLabelEvent = (
    analytics: SuiteSyncAnalytics | undefined,
    entityType: LabelEntityType,
    network: string | undefined,
    action: LabelAction,
) => {
    analytics?.report({
        type: sharedEvents.suiteSyncLabelCreatedEvent.name,
        payload: {
            entity_type: entityType,
            action,
            ...(network !== undefined && { network }),
        },
    });
};
