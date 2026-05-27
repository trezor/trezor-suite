import { type Account, type ReceiveInfo } from '@suite-common/wallet-types';

export const getFreshAddresses = (
    account: Account,
    alreadyUsedAddresses: ReceiveInfo[], // marked as already uses by the user (confirmed, labeled)
    pendingAddresses: string[], // addresses with pending transaction
    utxoBasedAccount: boolean,
) => {
    const unused = account.addresses
        ? account.addresses.unused
        : [
              {
                  path: account.path,
                  address: account.descriptor,
                  transfers: account.history.total,
              },
          ];

    if (!utxoBasedAccount) {
        return unused;
    }

    return unused.filter(
        address =>
            !alreadyUsedAddresses.find(receiveAddress => receiveAddress.path === address.path) &&
            !pendingAddresses.includes(address.address),
    );
};

export const getFirstFreshAddress = (
    account: Account,
    alreadyUsedAddresses: ReceiveInfo[], // marked as already uses by the user (confirmed, labeled)
    pendingAddresses: string[], // addresses with pending transaction
    utxoBasedAccount: boolean,
) => {
    const freshAddresses = getFreshAddresses(
        account,
        alreadyUsedAddresses,
        pendingAddresses,
        utxoBasedAccount,
    );

    // NOTE: freshAddresses[0] can be undefined (limit exceeded)
    return freshAddresses[0];
};
