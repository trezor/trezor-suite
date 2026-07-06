import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { type DeviceRootState } from '@suite-common/device';
import { type AccountType, type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    selectAccountByKey,
    selectDeviceAccountKeyForNetworkSymbolAndAccountTypeWithIndex,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { isAccountFailed } from '@suite-common/wallet-utils';

type AccountIdentity = {
    networkSymbol: NetworkSymbol;
    accountType: AccountType;
    accountIndex: number;
};

type UseResolvedAccountKeyArgs = Partial<AccountIdentity> & {
    accountKey?: AccountKey;
    setParams: (identity: AccountIdentity) => void;
};

/**
 * Resolves the account key from the route params. The route's account key wins while its account
 * exists; once it disappears, the account identity (symbol + type + index) of the selected device
 * takes over. While a failed account is displayed, its identity is persisted to the route params,
 * so that after a discovery retry replaces the account under a new key, the screen re-resolves to
 * the replacement automatically (mirroring desktop routing).
 */
export const useResolvedAccountKey = ({
    accountKey: routeAccountKey,
    networkSymbol,
    accountType,
    accountIndex,
    setParams,
}: UseResolvedAccountKeyArgs) => {
    const identityAccountKey = useSelector((state: AccountsRootState & DeviceRootState) =>
        selectDeviceAccountKeyForNetworkSymbolAndAccountTypeWithIndex(
            state,
            networkSymbol,
            accountType,
            accountIndex,
        ),
    );

    const routeKeyAccount = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, routeAccountKey),
    );

    const accountKey = routeKeyAccount ? routeAccountKey : (identityAccountKey ?? routeAccountKey);

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    useEffect(() => {
        if (account && isAccountFailed(account) && networkSymbol === undefined) {
            setParams({
                networkSymbol: account.symbol,
                accountType: account.accountType,
                accountIndex: account.index,
            });
        }
    }, [account, networkSymbol, setParams]);

    return accountKey;
};
