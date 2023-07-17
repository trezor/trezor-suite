import { NotificationEntry } from '@suite-common/suite-types';

export const settingsCommonConfig = {
    MAX_ACCOUNTS: 10,
    FRESH_ADDRESS_LIMIT: 20,
    TXS_PER_PAGE: 25,
} as const;

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

export const SETTINGS = {
    ...settingsCommonConfig,
    DEFAULT_GRAPH_RANGE: {
        label: 'all',
        startDate: null,
        endDate: null,
        groupBy: 'month',
    },
    IMPORTANT_NOTIFICATION_TYPES,
} as const;
