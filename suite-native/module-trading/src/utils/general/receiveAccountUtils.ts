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
