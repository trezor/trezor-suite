import { AccountTableSchema } from './data/accountTable';
import { AddressTableSchema } from './data/addressTable';
import { OutputTableSchema } from './data/outputTable';
import { WalletTableSchema } from './data/walletTable';

export const Schema = {
    ...WalletTableSchema,
    ...AccountTableSchema,
    ...AddressTableSchema,
    ...OutputTableSchema,
};
