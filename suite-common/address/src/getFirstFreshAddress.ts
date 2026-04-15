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
            !pendingAddresses.find(pendingAddress => pendingAddress === address.address),
    );

    return utxoBasedAccount ? unrevealed[0] : unused[0];
};
