import { useMemo } from 'react';

import { type PortfolioAccount, toPortfolioAccount } from '@suite-common/chain-data';
import { selectAllStellarContractTokens } from '@suite-common/wallet-core';
import type { Account } from '@suite-common/wallet-types';

import { useSelector } from 'src/hooks/suite';

export type LegacyPortfolioAccounts = {
    /** Accounts read from a chain backend, with the tokens the user watches on them. */
    accounts: readonly PortfolioAccount[];

    /** Some account is not read from a chain backend (failed, CoinJoin). */
    hasUnreadableAccount: boolean;
};

/** Today's Redux accounts as chain-data accounts, until Redux stores them in that shape. */
export const useLegacyPortfolioAccounts = (
    legacyAccounts: readonly Account[],
): LegacyPortfolioAccounts => {
    const watchedContractsByAccount = useSelector(selectAllStellarContractTokens);

    return useMemo(() => {
        const accounts = legacyAccounts.map(account =>
            toPortfolioAccount(account, watchedContractsByAccount[account.key]),
        );

        return {
            accounts: accounts.filter((account): account is PortfolioAccount => account !== null),
            hasUnreadableAccount: accounts.includes(null),
        };
    }, [legacyAccounts, watchedContractsByAccount]);
};
