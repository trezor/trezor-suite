import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';

import { hasAccountActiveStaking } from './hasAccountActiveStaking';
import { type MobileStakingSupport, getMobileStakingSupport } from './mobileStakingSupport';

type ResolveStakingPromoAccountsParams = {
    symbol: NetworkSymbol;
    accounts: Account[];
    isDeviceInViewOnlyMode: boolean;
};

export type NavigableStakingSupport = Exclude<MobileStakingSupport, 'desktop-only'>;

export type StakingPromoAccountsResolution =
    | { type: 'desktop-only' }
    | { type: 'enable-network' }
    | { type: 'connect-device' }
    | { type: 'navigate'; support: NavigableStakingSupport; navigableAccounts: Account[] };

export const resolveStakingPromoAccounts = ({
    symbol,
    accounts,
    isDeviceInViewOnlyMode,
}: ResolveStakingPromoAccountsParams): StakingPromoAccountsResolution => {
    const networkSupport = getMobileStakingSupport(symbol);

    if (networkSupport === null) {
        return { type: 'desktop-only' };
    }

    const accountsForSymbol = accounts.filter(account => account.symbol === symbol);

    if (accountsForSymbol.length === 0) {
        return { type: 'enable-network' };
    }

    if (networkSupport === 'desktop-only') {
        return { type: 'desktop-only' };
    }

    const support: NavigableStakingSupport = isDeviceInViewOnlyMode ? 'view' : networkSupport;

    if (support === 'manage') {
        return { type: 'navigate', support, navigableAccounts: accountsForSymbol };
    }

    const stakedAccounts = accountsForSymbol.filter(hasAccountActiveStaking);

    if (stakedAccounts.length > 0) {
        return { type: 'navigate', support, navigableAccounts: stakedAccounts };
    }

    return networkSupport === 'manage' ? { type: 'connect-device' } : { type: 'desktop-only' };
};
