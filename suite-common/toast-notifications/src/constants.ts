export const TRANSACTION_BROADCAST_NOTIFICATION_TYPES = [
    'tx-sent',
    'raw-tx-sent',
    'tx-revoked',
    'tx-approved',
    'tx-exchange',
    'tx-staked',
    'tx-unstaked',
    'tx-claimed',
    'tx-yield-deposit',
    'tx-yield-withdraw',
    'tx-yield-claim',
] as const;

export type TransactionBroadcastNotificationType =
    (typeof TRANSACTION_BROADCAST_NOTIFICATION_TYPES)[number];
