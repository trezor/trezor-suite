import { NotificationEntry } from '@suite-common/toast-notifications';
import { settingsCommonConfig } from '@suite-common/suite-config';

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
        label: 'all',
        startDate: null,
        endDate: null,
        groupBy: 'month',
    },
    IMPORTANT_NOTIFICATION_TYPES,
} as const;
