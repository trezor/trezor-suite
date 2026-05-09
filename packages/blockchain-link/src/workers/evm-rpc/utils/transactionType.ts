export type TransactionType = 'sent' | 'recv' | 'self' | 'unknown';

interface TransactionAddresses {
    from: string;
    to?: string | null;
}

export const getTransactionType = (
    tx: TransactionAddresses,
    userAddress: string,
): TransactionType => {
    const { from, to } = tx;

    if (!to) return from === userAddress ? 'sent' : 'unknown';

    const isFromUser = from === userAddress;
    const isToUser = to === userAddress;

    if (isFromUser && isToUser) return 'self';
    if (isFromUser) return 'sent';
    if (isToUser) return 'recv';

    return 'unknown';
};
