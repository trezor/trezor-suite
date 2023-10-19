interface AccountMetadata {
    accountLabel?: string;
    [key: string]: any;
}

type OldAccount = {
    metadata: AccountMetadata;
    [key: string]: any;
};

type MigratedAccount = {
    accountLabel?: string;
    [key: string]: any;
};

export const migrateAccountLabel = (oldAccounts: OldAccount[]): MigratedAccount[] =>
    oldAccounts.map(oldAccount => {
        if (!oldAccount.metadata || !oldAccount.metadata.accountLabel) {
            return oldAccount;
        }

        const { accountLabel, ...metadataWithoutAccountLabel } = oldAccount.metadata;

        return {
            ...oldAccount,
            accountLabel,
            metadata: {
                ...metadataWithoutAccountLabel,
            },
        };
    });
