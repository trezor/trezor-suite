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

export const getTransferAddressesFromLog = (
    topics: string[],
): { from: string; to: string } | null => {
    if (topics.length < 3) {
        return null;
    }

    // Topics are padded to 32 bytes, addresses are 20 bytes
    // Remove '0x' and take last 40 characters (20 bytes)
    const from = `0x${topics[1].slice(26)}`.toLowerCase();
    const to = `0x${topics[2].slice(26)}`.toLowerCase();

    return { from, to };
};
