import { type NetworkConfigDeps } from '@suite-common/networks';
import { isAccountBasedNetwork } from '@suite-common/wallet-config';
import type { ReceiveAccount } from '@suite-native/trading-types';

export const isFullySelectedReceiveAccount = (
    networkConfigDeps: NetworkConfigDeps,
    receiveAccount: ReceiveAccount | undefined,
): receiveAccount is ReceiveAccount => {
    if (!receiveAccount) {
        return false;
    }

    const { account, address } = receiveAccount;

    return isAccountBasedNetwork(networkConfigDeps, account.symbol) || !!address;
};

export const getReceiveAccountAddressText = (
    networkConfigDeps: NetworkConfigDeps,
    receiveAccount: ReceiveAccount | undefined,
) => {
    if (!receiveAccount) {
        return undefined;
    }

    const { account, address } = receiveAccount;

    return isAccountBasedNetwork(networkConfigDeps, account.symbol)
        ? account.descriptor
        : address?.address;
};
