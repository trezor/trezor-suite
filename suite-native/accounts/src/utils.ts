import { A } from '@mobily/ts-belt';
import { type NetworkConfigDeps } from '@suite-common/networks';

import { type AccountWithSuiteSyncLabel } from '@suite-common/suite-sync';
import { type AccountType, type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { getFormattedAccountType } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { orderedAccountTypes, sendDisabledNetworkTypes } from '@suite-native/config';

const accountTypeToSectionHeader: Readonly<Partial<Record<AccountType, string>>> = {
    normal: 'default',
    taproot: 'Taproot',
    segwit: 'Legacy Segwit',
    legacy: 'Legacy',
    ledger: 'Ledger',
    root: 'Root',
};

/**
 * Returns true if account label, network name, account type or account included token contains filter value as a substring.
 */
export const isFilterValueMatchingAccount = (
    networkConfigDeps: NetworkConfigDeps,
    account: AccountWithSuiteSyncLabel,
    filterValue: string,
) => {
    const lowerCaseFilterValue = filterValue?.trim().toLowerCase();

    const isMatchingLabel = (account.label ?? '').toLowerCase().includes(lowerCaseFilterValue);

    if (isMatchingLabel) return true;

    const accountNetwork = getNetwork(networkConfigDeps, account.symbol);
    const isMatchingNetworkName = accountNetwork.name.toLowerCase().includes(lowerCaseFilterValue);

    if (isMatchingNetworkName) return true;

    const isBitcoinNetworkType =
        getNetwork(networkConfigDeps, account.symbol).networkType === 'bitcoin';
    const lowercasedSectionHeader = accountTypeToSectionHeader[account.accountType]?.toLowerCase();

    const lowerCasedAccountType = getFormattedAccountType(
        account.networkType,
        account.accountType,
    )?.toLowerCase();

    const isMatchingAccountType =
        (lowercasedSectionHeader?.includes(filterValue) ||
            (isBitcoinNetworkType && lowerCasedAccountType?.includes(filterValue))) ??
        false;

    if (isMatchingAccountType) return true;

    const isMatchingTokenName =
        account.tokens?.some(token => token.name?.toLowerCase().includes(lowerCaseFilterValue)) ??
        false;

    return isMatchingTokenName;
};

/**
 * Filter accounts by labels, network names and included token names.
 */
export const filterAccountsByLabelAndNetworkNames = (
    networkConfigDeps: NetworkConfigDeps,
    accounts: readonly AccountWithSuiteSyncLabel[],
    filterValue: string,
) => {
    if (!filterValue) return accounts;

    return A.filter(accounts, account =>
        isFilterValueMatchingAccount(networkConfigDeps, account, filterValue),
    );
};

export const filterAccountsByNetworkSymbols = (
    accounts: readonly AccountWithSuiteSyncLabel[],
    networkSymbols: NetworkSymbol[],
): readonly AccountWithSuiteSyncLabel[] => {
    if (networkSymbols.length === 0) return accounts;

    return A.filter(accounts, account => networkSymbols.includes(account.symbol));
};

export const filterSendAvailableAccounts = <T extends Account>(accounts: readonly T[]) =>
    A.filter(
        accounts,
        account =>
            !sendDisabledNetworkTypes.includes(account.networkType) &&
            Number(account.availableBalance) > 0,
    );

export const sortAccountsByNetworksAndAccountTypes = <T extends Account>(
    accounts: readonly T[],
    supportedNetworks: readonly NetworkSymbol[],
) =>
    A.sort(accounts, (a, b) => {
        const aOrder = supportedNetworks.indexOf(a.symbol) ?? Number.MAX_SAFE_INTEGER;
        const bOrder = supportedNetworks.indexOf(b.symbol) ?? Number.MAX_SAFE_INTEGER;

        if (aOrder === bOrder) {
            const aAccountTypeOrder =
                orderedAccountTypes.indexOf(a.accountType) ?? Number.MAX_SAFE_INTEGER;
            const bAccountTypeOrder =
                orderedAccountTypes.indexOf(b.accountType) ?? Number.MAX_SAFE_INTEGER;

            return aAccountTypeOrder - bAccountTypeOrder;
        }

        return aOrder - bOrder;
    });
