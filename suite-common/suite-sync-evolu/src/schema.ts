import { AccountLabelSchema } from './labeling/accountLabels';
import { AddressLabelSchema } from './labeling/addressLabels';
import { OutputLabelSchema } from './labeling/outputLabels';
import { WalletLabelSchema } from './labeling/walletLabels';

export const Schema = {
    ...WalletLabelSchema,
    ...AccountLabelSchema,
    ...AddressLabelSchema,
    ...OutputLabelSchema,
};
