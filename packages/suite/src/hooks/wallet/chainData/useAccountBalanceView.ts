import { useMemo } from 'react';

import { selectIsQueryChainDataEnabled } from '@suite/flags';
import {
    toLastKnownBalance,
    useAccountsFiatBalance,
    useChainAccountBalance,
    useSelectedChainNetworks,
} from '@suite-common/chain-data';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import {
    type Account,
    type BaseCurrencyAmount,
    asBaseCurrencyAmount,
} from '@suite-common/wallet-types';
import { BASE_CURRENCY_ZERO } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';

import { useLegacyPortfolioAccounts } from './useLegacyPortfolioAccounts';

export type AccountBalanceView = {
    formattedBalance: string;

    /** Set only when chain data owns the value; otherwise the legacy fiat conversion applies. */
    fiatValue?: BaseCurrencyAmount;
    isFiatLoading: boolean;
};

/**
 * Native balance of an account and its fiat value. With the `queryChainData` flag on and the
 * account's network migrated, both come from the account's chain network through TanStack Query;
 * otherwise this answers what Redux holds and fetches nothing.
 */
export const useAccountBalanceView = (account: Account): AccountBalanceView => {
    const isQueryChainDataEnabled = useSelector(selectIsQueryChainDataEnabled);
    const currency = useSelector(selectBaseCurrency);
    const networks = useSelectedChainNetworks();

    const legacyAccounts = useMemo(() => [account], [account]);
    const { accounts } = useLegacyPortfolioAccounts(legacyAccounts);
    const ref = accounts[0]?.chainAccounts[0] ?? null;
    const network = networks.find(({ symbol }) => symbol === ref?.symbol);
    const enabled = isQueryChainDataEnabled && !!network && !!ref;

    const balance = useChainAccountBalance({
        network,
        ref,
        enabled,
        lastKnownBalance: toLastKnownBalance(account),
    });
    const fiat = useAccountsFiatBalance({ networks, accounts, currency, enabled });

    if (!enabled) {
        return { formattedBalance: account.formattedBalance, isFiatLoading: false };
    }

    const fiatValue =
        fiat.fiatBalance === null
            ? undefined
            : asBaseCurrencyAmount(new BigNumber(fiat.fiatBalance));

    return {
        formattedBalance: balance.data?.displayBalance ?? account.formattedBalance,
        fiatValue: fiatValue ?? (fiat.isPending ? BASE_CURRENCY_ZERO : undefined),
        isFiatLoading: fiat.isPending,
    };
};
