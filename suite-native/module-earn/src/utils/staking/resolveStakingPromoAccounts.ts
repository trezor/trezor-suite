import { type StakingProductAccess } from '@suite-common/earn-staking-common';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';

type ResolveStakingPromoAccountsParams = {
    symbol: NetworkSymbol;
    /** Access to the product the network stakes on; null when it has none. */
    access: StakingProductAccess | null;
    accounts: Account[];
    isAccountStakingActive: (account: Account) => boolean;
    isDeviceInViewOnlyMode: boolean;
};

export type NavigableStakingSupport = 'manage' | 'read-only';

export type StakingPromoAccountsResolution =
    | { type: 'desktop-only' }
    | { type: 'enable-network' }
    | { type: 'connect-device' }
    | { type: 'navigate'; support: NavigableStakingSupport; navigableAccounts: Account[] };

export const resolveStakingPromoAccounts = ({
    symbol,
    access,
    accounts,
    isAccountStakingActive,
    isDeviceInViewOnlyMode,
}: ResolveStakingPromoAccountsParams): StakingPromoAccountsResolution => {
    if (access === null || access === 'hidden') {
        return { type: 'desktop-only' };
    }

    const accountsForSymbol = accounts.filter(account => account.symbol === symbol);

    if (accountsForSymbol.length === 0) {
        return { type: 'enable-network' };
    }

    if (access === 'listed') {
        return { type: 'desktop-only' };
    }

    const support: NavigableStakingSupport = isDeviceInViewOnlyMode ? 'read-only' : access;

    if (support === 'manage') {
        return { type: 'navigate', support, navigableAccounts: accountsForSymbol };
    }

    const stakedAccounts = accountsForSymbol.filter(isAccountStakingActive);

    if (stakedAccounts.length > 0) {
        return { type: 'navigate', support, navigableAccounts: stakedAccounts };
    }

    return access === 'manage' ? { type: 'connect-device' } : { type: 'desktop-only' };
};
