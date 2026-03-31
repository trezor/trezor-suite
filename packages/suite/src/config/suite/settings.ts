import { endOfToday, startOfDay, subMonths } from 'date-fns';

import { settingsCommonConfig } from '@suite-common/suite-config';
import { type NotificationEntry } from '@suite-common/toast-notifications';

const IMPORTANT_NOTIFICATION_TYPES: Array<NotificationEntry['type']> = [
    'tx-sent',
    'tx-received',
    'tx-confirmed',
    'clear-storage',
    'pin-changed',
    'wipe-code-changed',
    'wipe-code-removed',
    'device-wiped',
    'backup-success',
    'backup-failed',
];

export default {
    ...settingsCommonConfig,
    DEFAULT_GRAPH_RANGE: {
        label: 'month',
        startDate: startOfDay(subMonths(endOfToday(), 1)),
        endDate: endOfToday(),
        groupBy: 'day',
    },
    IMPORTANT_NOTIFICATION_TYPES,
} as const;
