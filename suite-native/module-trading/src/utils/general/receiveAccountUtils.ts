import { invariant } from '@suite-common/suite-utils';

import { ReceiveAccount } from '../../types/general';

export const isFullySelectedReceiveAccount = (
    receiveAccount: ReceiveAccount | undefined,
): receiveAccount is ReceiveAccount => {
    if (!receiveAccount) {
        return false;
    }

    const { account, address } = receiveAccount;

    return !account.addresses || !!address;
};

export const getReceiveAccountAddressText = (receiveAccount: ReceiveAccount | undefined) => {
    if (!receiveAccount) {
        return undefined;
    }

    const { account, address } = receiveAccount;

    return account.addresses ? address?.address : account.descriptor;
};

export const getReceiveAccountFromAccountAndAddressString = (
    account: ReceiveAccount['account'],
    receiveAddress?: string,
): ReceiveAccount => {
    if (!receiveAddress) {
        return { account };
    }

    invariant(account.addresses, `Account ${account.key} has no addresses`);

    const addressPredicate = ({ address }: NonNullable<ReceiveAccount['address']>) =>
        address === receiveAddress;
    const { used, unused, change } = account.addresses;
    const address =
        used.find(addressPredicate) ??
        unused.find(addressPredicate) ??
        change.find(addressPredicate);
    invariant(address, `Address ${receiveAddress} not found in the account ${account.key}`);

    return { account, address };
};
