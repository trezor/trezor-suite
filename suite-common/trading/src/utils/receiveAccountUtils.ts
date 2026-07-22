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
    const account = accounts?.[0];

    if (!account) {
        return null;
    }

    if (sendAccount?.symbol === receiveAssetNetworkSymbol) {
        const { address } = getUnusedAddressFromAccount(sendAccount);

        return {
            accountKey: sendAccount.key,
            address,
        };
    }

    const { address } = getUnusedAddressFromAccount(account);

    return {
        accountKey: account.key,
        address,
    };
};
