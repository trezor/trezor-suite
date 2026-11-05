import { AccountTableSchema } from './data/accountTable';
import { AddressTableSchema } from './data/addressTable';
import { OutputTableSchema } from './data/outputTable';
import { WalletTableSchema } from './data/walletTable';
import { WardMetaTableSchema } from './data/wardMetaTable';
import { WardRootTableSchema } from './data/wardRootTable';

// Keep this explicit intersection to prevent TypeScript from expanding every table in the
// emitted declaration.
type SuiteSyncSchema = typeof WalletTableSchema &
    typeof AccountTableSchema &
    typeof AddressTableSchema &
    typeof OutputTableSchema;

export const Schema: SuiteSyncSchema = {
    ...WalletTableSchema,
    ...AccountTableSchema,
    ...AddressTableSchema,
    ...OutputTableSchema,
    // WARD authentication layer (additive; augments the address label rows).
    ...WardMetaTableSchema,
    ...WardRootTableSchema,
};
