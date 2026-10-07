import { useMemo } from 'react';

import { selectIsQueryChainDataEnabled } from '@suite/flags';
import {
    type PortfolioAccount,
    toPortfolioAccount,
    useAccountsFiatBalance,
    useSelectedChainNetworks,
} from '@suite-common/chain-data';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import type { Account } from '@suite-common/wallet-types';

import { useSelector } from 'src/hooks/suite';

/**
 * Fiat total of the listed accounts from chain data, or `null` when the legacy total applies: the
 * `queryChainData` flag is off, some account is on a network not migrated yet, or no value is in.
 *
 * Unlike the legacy total it values native balances only; tokens and staking follow in the next
 * step of the migration.
 */
export const usePortfolioFiatBalance = (listedAccounts: Account[]): string | null => {
    const isQueryChainDataEnabled = useSelector(selectIsQueryChainDataEnabled);
    const currency = useSelector(selectBaseCurrency);
    const networks = useSelectedChainNetworks();

    const { accounts, hasUnreadableAccount } = useMemo(() => {
        const portfolioAccounts = listedAccounts.map(toPortfolioAccount);

        return {
            accounts: portfolioAccounts.filter(
                (account): account is PortfolioAccount => account !== null,
            ),
            hasUnreadableAccount: portfolioAccounts.includes(null),
        };
    }, [listedAccounts]);

    const fiat = useAccountsFiatBalance({
        networks,
        accounts,
        currency,
        enabled: isQueryChainDataEnabled,
    });

    const isOwnedByChainData =
        isQueryChainDataEnabled && fiat.isCovered && !hasUnreadableAccount && !fiat.isPending;

    return isOwnedByChainData ? fiat.fiatBalance : null;
};
