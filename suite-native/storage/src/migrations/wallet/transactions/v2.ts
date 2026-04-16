type TransactionStub = {
    symbol: string;
};

type AccountTransactionsType = {
    [x: string]: TransactionStub[];
};

export const migrateTransactionsBnbToBsc = (
    oldTransactions: AccountTransactionsType | undefined,
): AccountTransactionsType | undefined => {
    const newTransactions: AccountTransactionsType = {};

    for (const oldKey in oldTransactions) {
        const oldTxns = oldTransactions[oldKey];

        const newKey = oldKey.replace('-bnb-', '-bsc-');
        if (oldTxns) {
            newTransactions[newKey] = oldTxns.map(oldTxn => ({
                ...oldTxn,
                symbol: oldTxn.symbol.replace('bnb', 'bsc'),
            }));
        }
    }

    return newTransactions;
};
