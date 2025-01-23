import { WalletAccountTransaction } from '@suite-common/wallet-types';

import { ComposeCancelTransactionPartialAccount } from './cancelTransactionTypes';

type ResolveCancelAddress = {
    account: ComposeCancelTransactionPartialAccount;
    tx: Pick<WalletAccountTransaction, 'details'>;
};

export const resolveCancelAddress = ({ account, tx }: ResolveCancelAddress): string => {
    const firstChangeAddress = tx.details.vout.find(vout => vout.isAccountOwned);

    if (
        firstChangeAddress !== undefined &&
        firstChangeAddress.addresses !== undefined &&
        firstChangeAddress.addresses.length > 0
    ) {
        return firstChangeAddress.addresses[0];
    }

    if (account.addresses.unused.length < 1) {
        throw new Error('No unused addresses, should not happen!');
    }

    return account.addresses.unused[0].address;
};
