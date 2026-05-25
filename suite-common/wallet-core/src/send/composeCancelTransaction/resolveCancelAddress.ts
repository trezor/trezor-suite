import { type WalletAccountTransaction } from '@suite-common/wallet-types';

import { type ComposeCancelTransactionPartialAccount } from './cancelTransactionTypes';

type ResolveCancelAddress = {
    account: ComposeCancelTransactionPartialAccount;
    tx: Pick<WalletAccountTransaction, 'details'>;
};

export const resolveCancelAddress = ({ account, tx }: ResolveCancelAddress): string => {
    const firstChangeAddress = tx.details.vout.find(vout => vout.isAccountOwned);

    if (firstChangeAddress?.addresses?.length) {
        const { addresses } = firstChangeAddress;

        // @ts-expect-error - indexing noUncheckedIndexedAccess
        const firstAddress: string = addresses[0];

        return firstAddress;
    }

    if (account.addresses.unused.length < 1) {
        throw new Error('No unused addresses, should not happen!');
    }

    const { unused } = account.addresses;
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const firstUnused: (typeof unused)[number] = unused[0];

    return firstUnused.address;
};
