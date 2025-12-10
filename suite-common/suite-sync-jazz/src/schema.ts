import { co, z } from 'jazz-tools';

// Wallet Label Schema
export const WalletLabelSchema = co.map({
    walletDescriptor: z.string(),
    label: z.string().nullable(),
});

// Account Label Schema
export const AccountLabelSchema = co.map({
    accountDescriptor: z.string(),
    networkSymbol: z.string(),
    label: z.string().nullable(),
});

// Address Label Schema
export const AddressLabelSchema = co.map({
    address: z.string(),
    label: z.string().nullable(),
    accountDescriptor: z.string(),
    networkSymbol: z.string(),
});

// Output Label Schema
export const OutputLabelSchema = co.map({
    txId: z.string(),
    outputIndex: z.number(),
    label: z.string().nullable(),
    accountDescriptor: z.string(),
    networkSymbol: z.string(),
});

// Root schema that holds all label collections
export const SuiteSyncRoot = co.map({
    walletLabels: co.list(WalletLabelSchema),
    accountLabels: co.list(AccountLabelSchema),
    addressLabels: co.list(AddressLabelSchema),
    outputLabels: co.list(OutputLabelSchema),
});

// Account schema for Suite Sync
export const SuiteSyncAccount = co
    .account({
        root: SuiteSyncRoot,
        profile: co.profile(),
    })
    .withMigration(account => {
        if (!account.$jazz.has('root')) {
            account.$jazz.set('root', {
                walletLabels: [],
                accountLabels: [],
                addressLabels: [],
                outputLabels: [],
            });
        }
    });

export type WalletLabel = co.loaded<typeof WalletLabelSchema>;
export type AccountLabel = co.loaded<typeof AccountLabelSchema>;
export type AddressLabel = co.loaded<typeof AddressLabelSchema>;
export type OutputLabel = co.loaded<typeof OutputLabelSchema>;
export type SuiteSyncRoot = co.loaded<typeof SuiteSyncRoot>;
export type SuiteSyncAccount = co.loaded<typeof SuiteSyncAccount>;
