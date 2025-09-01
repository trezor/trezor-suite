import { Evolu } from '@evolu/common';

import { AccountLabelSchema, AccountLabels } from './labeling/evolu/accountLabels';
import { AddressLabelSchema, AddressLabels } from './labeling/evolu/addressLabels';
import { OutputLabelSchema, OutputLabels } from './labeling/evolu/outputLabels';
import { WalletLabelSchema, WalletLabels } from './labeling/evolu/walletLabels';
import { Schema } from './schema';

export class LocalFirstStorage {
    accountLabels: AccountLabels;
    walletLabels: WalletLabels;
    outputLabels: OutputLabels;
    addressLabels: AddressLabels;

    constructor(evolu: Evolu<typeof Schema>) {
        this.accountLabels = new AccountLabels(
            evolu as unknown as Evolu<typeof AccountLabelSchema>,
        );
        this.walletLabels = new WalletLabels(evolu as unknown as Evolu<typeof WalletLabelSchema>);
        this.outputLabels = new OutputLabels(evolu as unknown as Evolu<typeof OutputLabelSchema>);
        this.addressLabels = new AddressLabels(
            evolu as unknown as Evolu<typeof AddressLabelSchema>,
        );
    }
}
