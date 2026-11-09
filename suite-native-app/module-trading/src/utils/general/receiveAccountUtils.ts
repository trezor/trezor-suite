import { isAccountBasedNetwork } from '@suite-common/wallet-config';
import type { ReceiveAccount } from '@suite-native/trading-types';

export const isFullySelectedReceiveAccount = (
    receiveAccount: ReceiveAccount | undefined,
): receiveAccount is ReceiveAccount => {
    if (!receiveAccount) {
        return false;
    }

    const { account, address } = receiveAccount;

    return isAccountBasedNetwork(account.symbol) || !!address;
};

export const getReceiveAccountAddressText = (receiveAccount: ReceiveAccount | undefined) => {
    if (!receiveAccount) {
        return undefined;
    }

    const { account, address } = receiveAccount;

    return isAccountBasedNetwork(account.symbol) ? account.descriptor : address?.address;
};
