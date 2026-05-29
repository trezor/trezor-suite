import { type NetworkSymbol, isAccountBasedNetwork } from '@suite-common/wallet-config';
import { type Account, type AccountKey } from '@suite-common/wallet-types';

import { getUnusedAddressFromAccount } from '../utils';

type GetReceiveAccountPreselectionParams = {
    receiveAssetNetworkSymbol: NetworkSymbol;
    accounts: Account[];
    sendAccount?: Account;
};

export type ReceiveAccountPreselection = {
    accountKey: AccountKey;
    address?: string;
};

export const getReceiveAccountPreselection = ({
    receiveAssetNetworkSymbol,
    accounts,
    sendAccount,
}: GetReceiveAccountPreselectionParams): ReceiveAccountPreselection | null => {
    if (accounts.length === 0) {
        return null;
    }

    const isAccountBased = isAccountBasedNetwork(receiveAssetNetworkSymbol);

    if (sendAccount?.symbol === receiveAssetNetworkSymbol) {
        return {
            accountKey: sendAccount.key,
            address: isAccountBased ? undefined : getUnusedAddressFromAccount(sendAccount).address,
        };
    }

    if (!isAccountBased) {
        const account = accounts[0];
        const { address } = getUnusedAddressFromAccount(account);

        return {
            accountKey: account.key,
            address,
        };
    }

    return {
        accountKey: accounts[0].key,
    };
};
