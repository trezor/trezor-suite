import { AccountLabelSchema } from './labeling/evolu/accountLabels';
import { AddressLabelSchema } from './labeling/evolu/addressLabels';
import { OutputLabelSchema } from './labeling/evolu/outputLabels';
import { WalletLabelSchema } from './labeling/evolu/walletLabels';

export const Schema = {
    ...WalletLabelSchema,
    ...AccountLabelSchema,
    ...AddressLabelSchema,
    ...OutputLabelSchema,
};
