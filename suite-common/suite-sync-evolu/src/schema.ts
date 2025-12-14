import { AccountSchema } from './data/accountTable';
import { AddressLabelSchema } from './data/addressTable';
import { OutputLabelSchema } from './data/outputTable';
import { WalletLabelSchema } from './data/walletTable';

export const Schema = {
    ...WalletLabelSchema,
    ...AccountSchema,
    ...AddressLabelSchema,
    ...OutputLabelSchema,
};
