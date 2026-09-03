import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    isSupportedAdaStakingNetworkSymbol,
    isSupportedNativeStakingManagementSymbol,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';

import { hasAccountActiveStaking } from './hasAccountActiveStaking';

type ResolveStakingPromoAccountsParams = {
    symbol: NetworkSymbol;
    accounts: Account[];
};

type StakingPromoAccountsResolution =
    { isDesktopOnly: true } | { isDesktopOnly: false; navigableAccounts: Account[] };

export const resolveStakingPromoAccounts = ({
    symbol,
    accounts,
}: ResolveStakingPromoAccountsParams): StakingPromoAccountsResolution => {
    const isCardanoStaking = isSupportedAdaStakingNetworkSymbol(symbol);

    if (!isSupportedNativeStakingManagementSymbol(symbol) && !isCardanoStaking) {
        return { isDesktopOnly: true };
    }

    const accountsForSymbol = accounts.filter(account => account.symbol === symbol);

    if (!isCardanoStaking) {
        return { isDesktopOnly: false, navigableAccounts: accountsForSymbol };
    }

    const delegatedAccounts = accountsForSymbol.filter(hasAccountActiveStaking);

    if (delegatedAccounts.length === 0) {
        return { isDesktopOnly: true };
    }

    return { isDesktopOnly: false, navigableAccounts: delegatedAccounts };
};
