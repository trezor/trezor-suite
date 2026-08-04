import { type Account, type ReceiveInfo } from '@suite-common/wallet-types';
import { type AccountAddress } from '@trezor/connect';
import { comparePath } from '@trezor/crypto-utils';

const isPathLowerThanAnyUsedPath = (path: string, usedPaths: string[]) =>
    usedPaths.some(usedPath => comparePath(path, usedPath) < 0);

export const getFreshAddresses = (
    account: Account,
    alreadyUsedAddresses: ReceiveInfo[], // marked as already uses by the user (confirmed, labeled)
    pendingAddresses: string[], // addresses with pending transaction
    utxoBasedAccount: boolean,
): AccountAddress[] => {
    const descriptorAddress: AccountAddress = {
        path: account.path,
        address: account.descriptor,
        transfers: account.history.total,
        balance: '0',
        sent: '0',
        received: '0',
    };

    if (!utxoBasedAccount) {
        return [descriptorAddress];
    }

    const unused = account.addresses ? account.addresses.unused : [descriptorAddress];
    const usedPaths = alreadyUsedAddresses.map(address => address.path);

    return unused.filter(
        address =>
            !alreadyUsedAddresses.find(receiveAddress => receiveAddress.path === address.path) &&
            !pendingAddresses.includes(address.address) &&
            !isPathLowerThanAnyUsedPath(address.path, usedPaths),
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
