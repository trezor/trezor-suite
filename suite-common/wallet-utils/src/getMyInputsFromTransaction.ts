import { Account } from '@suite-common/wallet-types';
import { AccountTransaction } from '@trezor/connect';

export type GetMyInputsFromTransactionParams = {
    account: Pick<Account, 'addresses'>;
    tx: Pick<AccountTransaction, 'details'>;
};

export const getMyInputsFromTransaction = ({ account, tx }: GetMyInputsFromTransactionParams) => {
    const changeAddresses = account.addresses ? account.addresses.change : [];
    const allAddresses = account.addresses
        ? changeAddresses.concat(account.addresses.used).concat(account.addresses.unused)
        : [];

    return tx.details.vin.flatMap(input => {
        // find input AccountAddress
        const addr = allAddresses.find(a => input.addresses?.includes(a.address));
        if (!addr) return []; // skip utxo, TODO: set some error? is it even possible?

        // re-create utxo from the input
        return {
            amount: input.value!,
            txid: input.txid!,
            vout: input.vout || 0,
            address: addr!.address,
            path: addr!.path,
            blockHeight: 0,
            confirmations: 0,
            required: true,
        };
    });
};
