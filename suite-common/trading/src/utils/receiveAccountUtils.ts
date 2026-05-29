import { type NetworkSymbol } from '@suite-common/wallet-config';
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

    if (sendAccount?.symbol === receiveAssetNetworkSymbol) {
        const { address } = getUnusedAddressFromAccount(sendAccount);

        return {
            accountKey: sendAccount.key,
            address,
        };
    }

    const account = accounts[0];
    const { address } = getUnusedAddressFromAccount(account);

    return {
        accountKey: account.key,
        address,
    };
};
