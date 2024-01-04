import { A, D, G } from '@mobily/ts-belt';

import { AccountType, networks } from '@suite-common/wallet-config';
import { formattedBitcoinAccountTypeMap } from '@suite-common/wallet-core/src/accounts/constants';
import { Account } from '@suite-common/wallet-types';
import { getNetwork } from '@suite-common/wallet-utils';

const accountTypeToSectionHeader: Readonly<Partial<Record<AccountType, string>>> = {
    normal: 'default',
    taproot: 'Taproot',
    segwit: 'Legacy Segwit',
    legacy: 'Legacy',
    ledger: 'Ledger',
};

/**
 * Returns true if account label, network name, account type or account included token contains filter value as a substring.
 */
export const isFilterValueMatchingAccount = (account: Account, filterValue: string) => {
    const lowerCaseFilterValue = filterValue?.trim().toLowerCase();

    const isMatchingLabel = account.accountLabel?.toLowerCase().includes(lowerCaseFilterValue);

    if (isMatchingLabel) return true;

    const accountNetwork = getNetwork(account.symbol);
    const isMatchingNetworkName = accountNetwork?.name.toLowerCase().includes(lowerCaseFilterValue);

    if (isMatchingNetworkName) return true;

    const isBitcoinNetworkType = networks[account.symbol].networkType === 'bitcoin';
    const lowercasedSectionHeader = accountTypeToSectionHeader[account.accountType]?.toLowerCase();
    const lowercasedBitcoinAccountType =
        formattedBitcoinAccountTypeMap[account.accountType]?.toLowerCase();

    const isMatchingAccountType =
        (lowercasedSectionHeader?.includes(filterValue) ||
            (isBitcoinNetworkType && lowercasedBitcoinAccountType?.includes(filterValue))) ??
        false;

    if (isMatchingAccountType) return true;

    const isMatchingTokenName =
        account.tokens?.some(token => token.name?.toLowerCase().includes(lowerCaseFilterValue)) ??
        false;

    if (isMatchingTokenName) return true;

    return false;
};

/**
 * Filter accounts by labels, network names and included token names.
 */
export const filterAccountsByLabelAndNetworkNames = (
    accounts: readonly Account[],
    filterValue: string,
) => {
    if (!filterValue) return accounts;

    return A.filter(accounts, account => isFilterValueMatchingAccount(account, filterValue));
};

/**
 * Returns object with key equal string composed by network name and account type. Values are arrays of corresponding accounts.
 */
export const groupAccountsByNetworkAccountType = A.groupBy((account: Account) => {
    const { symbol, accountType } = account;
    const networkConfig = networks[symbol];
    const networkName = networkConfig.name;
    const formattedAccountType = accountTypeToSectionHeader[accountType];

    if (D.isEmpty(networkConfig.accountTypes) || G.isNullable(formattedAccountType))
        return `${networkName} accounts`;

    return `${networkName} ${formattedAccountType} accounts`;
});
