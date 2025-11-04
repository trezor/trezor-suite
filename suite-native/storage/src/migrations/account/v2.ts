interface AccountMetadata {
    accountLabel?: string;
    [key: string]: any;
}

type OldAccount = {
    metadata: AccountMetadata;
    [key: string]: any;
};

const isOldAccount = (oldAccount: object): oldAccount is OldAccount => {
    if (!oldAccount || !('metadata' in oldAccount)) return false;

    if (
        typeof oldAccount.metadata !== 'object' ||
        oldAccount.metadata === null ||
        !('accountLabel' in oldAccount.metadata) ||
        typeof oldAccount.metadata.accountLabel !== 'string'
    ) {
        return false;
    }

    return true;
};

type MigratedAccount = {
    accountLabel?: string;
    [key: string]: any;
};

export const migrateAccountLabel = (oldAccounts: object[]): MigratedAccount[] =>
    oldAccounts.map(oldAccount => {
        if (!isOldAccount(oldAccount)) return oldAccount as MigratedAccount;

        const { accountLabel, ...metadataWithoutAccountLabel } = oldAccount.metadata;

        return {
            ...oldAccount,
            accountLabel,
            metadata: {
                ...metadataWithoutAccountLabel,
            },
        };
    });
