import { selectIsQueryChainDataEnabled } from '@suite/flags';
import { useAccountsFiatBalance, useSelectedChainNetworks } from '@suite-common/chain-data';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import type { Account } from '@suite-common/wallet-types';

import { useSelector } from 'src/hooks/suite';

import { useLegacyPortfolioAccounts } from './useLegacyPortfolioAccounts';

/**
 * Fiat total of the listed accounts from chain data, or `null` when the legacy total applies: the
 * `queryChainData` flag is off, some account is not read from a chain backend, or no value is in.
 *
 * Unlike the legacy total it values native balances only; tokens and staking follow in the next
 * step of the migration.
 */
export const usePortfolioFiatBalance = (listedAccounts: Account[]): string | null => {
    const isQueryChainDataEnabled = useSelector(selectIsQueryChainDataEnabled);
    const currency = useSelector(selectBaseCurrency);
    const networks = useSelectedChainNetworks();

    const { accounts, hasUnreadableAccount } = useLegacyPortfolioAccounts(listedAccounts);

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
