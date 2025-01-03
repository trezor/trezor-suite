type TransactionStub = {
    symbol: string;
};

type AccountTransactionsType = {
    [x: string]: TransactionStub[];
};

const deprecatedNetworks: string[] = ['dash', 'btg', 'nmc', 'vtc', 'dgb'];

export const migrateTransactionsDeprecateNetworks = (
    oldTransactions: AccountTransactionsType | undefined,
): AccountTransactionsType | undefined => {
    const newTransactions: AccountTransactionsType = {};

    for (const oldKey in oldTransactions) {
        const oldTxns = oldTransactions[oldKey];

        const newTxns = oldTxns.filter(txn => !deprecatedNetworks.includes(txn.symbol));
        if (newTxns.length > 0) {
            newTransactions[oldKey] = newTxns;
        }
    }

    return newTransactions;
};
