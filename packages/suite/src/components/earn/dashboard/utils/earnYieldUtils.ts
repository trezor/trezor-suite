import { type AccountType, networkSymbolCollection, networks } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

type YieldRowWithAvailableBalance = {
    additionalDepositAmount: string;
    matchedInputToken: unknown;
    account?: {
        formattedBalance: string;
    };
};

type YieldRowWithDepositedBalance = {
    depositedAmount: string;
};

const getYieldAvailableBalanceForSorting = (row: YieldRowWithAvailableBalance) =>
    row.matchedInputToken ? row.additionalDepositAmount : (row.account?.formattedBalance ?? '0');

export const compareYieldRowsByDepositedAmountDesc = (
    a: YieldRowWithDepositedBalance,
    b: YieldRowWithDepositedBalance,
) => new BigNumber(b.depositedAmount).comparedTo(a.depositedAmount) ?? 0;

export const compareYieldRowsByAvailableBalanceDesc = (
    a: YieldRowWithAvailableBalance,
    b: YieldRowWithAvailableBalance,
) =>
    new BigNumber(getYieldAvailableBalanceForSorting(b)).comparedTo(
        getYieldAvailableBalanceForSorting(a),
    ) ?? 0;

type YieldRowWithAccount = {
    account?: Pick<Account, 'symbol' | 'accountType' | 'index'>;
    depositedSymbol?: string;
};

/**
 * Groups rows by network only (in networkSymbolCollection order). Used for the deposited and
 * deposit buckets so a stable secondary sort by balance/deposited amount actually controls
 * the within-network order.
 */
export const compareYieldRowsByNetworkOnly = (a: YieldRowWithAccount, b: YieldRowWithAccount) => {
    if (!a.account || !b.account) return 0;

    const aSymbolIndex = networkSymbolCollection.indexOf(a.account.symbol);
    const bSymbolIndex = networkSymbolCollection.indexOf(b.account.symbol);

    return aSymbolIndex - bSymbolIndex;
};

/**
 * Groups by network → token symbol → account type → account index. Used for the depositable
 * and no-balance buckets so rows on the same network and token stay together regardless of
 * account type (normal/legacy/ledger).
 */
export const compareYieldRowsByTokenNetworkOrder = (
    a: YieldRowWithAccount,
    b: YieldRowWithAccount,
) => {
    if (!a.account || !b.account) return 0;

    const aSymbolIndex = networkSymbolCollection.indexOf(a.account.symbol);
    const bSymbolIndex = networkSymbolCollection.indexOf(b.account.symbol);
    if (aSymbolIndex !== bSymbolIndex) return aSymbolIndex - bSymbolIndex;

    if (a.depositedSymbol && b.depositedSymbol && a.depositedSymbol !== b.depositedSymbol) {
        return a.depositedSymbol.localeCompare(b.depositedSymbol);
    }

    const network = networks[a.account.symbol];
    const orderedAccountTypes = Object.keys(network.accountTypes) as AccountType[];
    const aAccountTypeIndex = orderedAccountTypes.indexOf(a.account.accountType);
    const bAccountTypeIndex = orderedAccountTypes.indexOf(b.account.accountType);
    if (aAccountTypeIndex !== bAccountTypeIndex) return aAccountTypeIndex - bAccountTypeIndex;

    return a.account.index - b.account.index;
};
