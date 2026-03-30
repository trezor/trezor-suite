import { type AnalyticsSharedEvents, events as sharedEvents } from '@suite-common/analytics';
import { type Analytics } from '@trezor/analytics-uploader';

import { type LabelEntityType, getLabelAction } from '../../suiteSyncAnalytics';

export type LabelingAnalytics = Pick<Analytics<AnalyticsSharedEvents>, 'report'>;

export type LabelingAnalyticsDep = {
    analytics?: LabelingAnalytics;
};

type ReportLabelEventParams = {
    analytics: LabelingAnalytics | undefined;
    entityType: LabelEntityType;
    network: string | undefined;
    previousLabel: string | null;
};

export const reportLabelEvent = ({
    analytics,
    entityType,
    network,
    previousLabel,
}: ReportLabelEventParams) => {
    analytics?.report({
        type: sharedEvents.suiteSyncLabelCreatedEvent.name,
        payload: {
            entity_type: entityType,
            action: getLabelAction(previousLabel),
            ...(network !== undefined && { network }),
        },
    });
};
