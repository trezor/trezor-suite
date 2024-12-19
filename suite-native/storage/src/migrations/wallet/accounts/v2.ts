type Account = {
    symbol: string;
    key: string;
};

export const migrateAccountBnbToBsc = (oldAccounts: Account[] | undefined): Account[] | undefined =>
    oldAccounts?.map(oldAccount => {
        const { key, symbol } = oldAccount;

        if (symbol !== 'bnb') return oldAccount;

        return {
            ...oldAccount,
            key: key.replace('-bnb-', '-bsc-'),
            symbol: 'bsc',
        };
    });
