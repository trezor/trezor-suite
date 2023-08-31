import { Account } from '@suite-common/wallet-types';
import { WalletParams } from 'src/types/wallet';

export const getSelectedAccount = (
    deviceState: string | typeof undefined,
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
