import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { type StaticSessionId } from '@trezor/connect';

import { type WalletParams } from 'src/types/wallet';

export const getAssetAccountRouteParams = (
    accounts: Account[],
    symbol: NetworkSymbol,
): NonNullable<WalletParams> => {
    const networkAccounts = accounts.filter(account => account.symbol === symbol);
    const account =
        networkAccounts.find(({ accountType, index }) => accountType === 'normal' && index === 0) ??
        networkAccounts[0];

    return {
        symbol,
        accountIndex: account?.index ?? 0,
        accountType: account?.accountType ?? 'normal',
    };
};

export const getSelectedAccount = (
    deviceState: StaticSessionId | undefined,
    accounts: Account[],
    routerParams: WalletParams | undefined,
) => {
    if (!deviceState || !routerParams) return null;

    // TODO: imported accounts
    // imported account index has 'i' prefix
    // const isImported = /^i\d+$/i.test(routerParams.accountIndex);
    // const index: number = isImported
    //     ? parseInt(routerParams.accountIndex.substring(1), 10)
    //     : parseInt(routerParams.accountIndex, 10);

    return (
        accounts.find(
            a =>
                a.index === routerParams.accountIndex &&
                a.symbol === routerParams.symbol &&
                a.accountType === routerParams.accountType &&
                a.deviceState === deviceState,
        ) || null
    );
};
