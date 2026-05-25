import { type Account, type ReceiveInfo } from '@suite-common/wallet-types';

export const getFirstFreshAddress = (
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
        return unused[0];
    }

    const unrevealed = unused.filter(
        address =>
            !alreadyUsedAddresses.find(receiveAddress => receiveAddress.path === address.path) &&
            !pendingAddresses.includes(address.address),
    );

    // NOTE: unrevealed[0] can be undefined (limit exceeded)
    return unrevealed[0];
};
