import { invariant } from '@suite-common/suite-utils';
import type { ReceiveAccount } from '@suite-native/trading-types';

export const getReceiveAccountFromAccountAndAddressString = (
    account: ReceiveAccount['account'],
    receiveAddress?: string,
): ReceiveAccount => {
    if (!receiveAddress) {
        return { account };
    }

    invariant(account.addresses, `Account has no addresses`);

    const addressPredicate = ({ address }: NonNullable<ReceiveAccount['address']>) =>
        address === receiveAddress;
    const { used, unused, change } = account.addresses;
    const address =
        used.find(addressPredicate) ??
        unused.find(addressPredicate) ??
        change.find(addressPredicate);
    invariant(address, `Address not found in the account`);

    return { account, address };
};
