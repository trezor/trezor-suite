import { NotificationEntry } from '@suite-reducers/notificationReducer';

const IMPORTANT_NOTIFICATION_TYPES: Array<NotificationEntry['type']> = [
    'tx-sent',
    'tx-received',
    'tx-confirmed',
    'clear-storage',
    'pin-changed',
    'device-wiped',
    'backup-success',
    'backup-failed',
];

export default {
    MAX_ACCOUNTS: 10,
    FRESH_ADDRESS_LIMIT: 20,
    TXS_PER_PAGE: 25,
    DEFAULT_GRAPH_RANGE: {
        label: 'all',
        startDate: null,
        endDate: null,
        groupBy: 'month',
    },
    IMPORTANT_NOTIFICATION_TYPES,
} as const;
