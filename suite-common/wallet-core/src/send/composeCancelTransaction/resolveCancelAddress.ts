import { type WalletAccountTransaction } from '@suite-common/wallet-types';

import { type ComposeCancelTransactionPartialAccount } from './cancelTransactionTypes';

type ResolveCancelAddress = {
    account: ComposeCancelTransactionPartialAccount;
    tx: Pick<WalletAccountTransaction, 'details'>;
};

export const resolveCancelAddress = ({ account, tx }: ResolveCancelAddress): string => {
    const firstChangeAddress = tx.details.vout.find(vout => vout.isAccountOwned);

    const firstAddress = firstChangeAddress?.addresses?.[0];
    if (firstAddress !== undefined) {
        return firstAddress;
    }

    const firstUnused = account.addresses.unused[0];
    if (!firstUnused) {
        throw new Error('No unused addresses, should not happen!');
    }

    return firstUnused.address;
};
