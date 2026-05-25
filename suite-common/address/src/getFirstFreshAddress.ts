import { type Account, type ReceiveInfo } from '@suite-common/wallet-types';

export const getFirstFreshAddress = (
    account: Account,
    receiveAddresses: ReceiveInfo[],
    pendingAddresses: string[],
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

    const unrevealed = unused.filter(
        address =>
            !receiveAddresses.find(receiveAddress => receiveAddress.path === address.path) &&
            !pendingAddresses.includes(address.address),
    );

    // NOTE: unrevealed[0] can be undefined (limit exceeded)
    return utxoBasedAccount ? unrevealed[0] : unused[0];
};
