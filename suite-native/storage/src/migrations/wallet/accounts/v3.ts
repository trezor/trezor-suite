type Account = {
    symbol: string;
    key: string;
};

const deprecatedNetworks: string[] = ['dash', 'btg', 'nmc', 'vtc', 'dgb'];

export const migrateAccountsDeprecateNetworks = (
    oldAccounts: Account[] | undefined,
): Account[] | undefined =>
    oldAccounts?.filter(account => !deprecatedNetworks.includes(account.symbol));
