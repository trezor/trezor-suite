import { AccountTableSchema } from './data/accountTable';
import { AddressTableSchema } from './data/addressTable';
import { OutputTableSchema } from './data/outputTable';
import { WalletTableSchema } from './data/walletTable';
import { WardMetaTableSchema } from './data/wardMetaTable';
import { WardRootTableSchema } from './data/wardRootTable';

export const Schema = {
    ...WalletTableSchema,
    ...AccountTableSchema,
    ...AddressTableSchema,
    ...OutputTableSchema,
    // WARD authentication layer (additive; augments the address label rows).
    ...WardMetaTableSchema,
    ...WardRootTableSchema,
};
