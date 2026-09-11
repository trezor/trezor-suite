import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import {
    isFunctionSelectorMatchesSearch,
    isNativeDisplaySymbolSearch,
    isNativeTransferMatchesSearch,
    isTokenTransferMatchesSearch,
} from '@suite-common/wallet-utils';
import { BigNumber, typedObjectKeys } from '@trezor/utils';

import { getTargetAmounts } from './getTargetAmounts';
import { numberSearchFilter } from './numberSearchFilter';
import { type SearchAccountLabels } from './searchLabels';
import { searchOperators } from './searchOperations';
import { getTransactionSearchIndex } from './transactionSearchIndex';

const searchDateRegex = new RegExp(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/);

/**
 * Whether the query is a number, and so worth comparing against amounts.
 *
 * `Number.isNaN(search)` does not answer this: it does not coerce, so for a string it is always
 * false — which made the amount comparison below run for every query ever typed, and made the
 * `return []` for a non-numeric amount search unreachable.
 */
const getIsNumericSearch = (search: string) => search !== '' && !Number.isNaN(Number(search));

export const simpleSearchTransactions = (
    transactions: WalletAccountTransaction[],
    accountLabels: SearchAccountLabels,
    search: string,
) => {
    // Trim
    search = search.trim();

    // If the string is empty or only contains search operators, there's no search
    if (['', ...searchOperators].includes(search)) {
        return transactions;
    }

    // Check for date
    if (searchDateRegex.test(search)) {
        // Add search operator so it gets picked up below
        search = `=${search}`;
    }

    // If it's an amount search (starting with <, > or = operator)
    const searchOperator = searchOperators.find(k => search.startsWith(k));
    if (searchOperator) {
        // Remove search operator from search string
        search = search.replace(searchOperator, '').trim();

        // Is date?
        if (searchDateRegex.test(search)) {
            const timestamp = +new Date(`${search}T00:00:00Z`) / 1000;
            switch (searchOperator) {
                case '>':
                    return transactions.filter(t => t.blockTime && t.blockTime > timestamp);
                case '<':
                    return transactions.filter(
                        t => t.blockTime && t.blockTime < timestamp + 24 * 60 * 60,
                    );
                case '=':
                    return transactions.filter(
                        t =>
                            t.blockTime &&
                            t.blockTime > timestamp &&
                            t.blockTime < timestamp + 24 * 60 * 60,
                    );
                case '!=':
                    return transactions.filter(
                        t =>
                            t.blockTime &&
                            (t.blockTime < timestamp || t.blockTime > timestamp + 24 * 60 * 60),
                    );
                // no default
            }
        }

        // Is number?
        if (getIsNumericSearch(search)) {
            const amount = new BigNumber(search);

            return transactions.filter(t => numberSearchFilter(t, amount, searchOperator));
        }

        return [];
    }

    const lowerCaseSearch = search.toLowerCase();
    const txsToSearch: string[] = [];
    // Built once for as long as the transactions and the labels are the same objects, rather than
    // once per keystroke and once per term of an advanced query.
    const { txidsByAddress, txidsByOutputLabel, addressesByLabel } = getTransactionSearchIndex(
        transactions,
        accountLabels,
    );

    // Searching for an amount (without operator)
    if (getIsNumericSearch(search)) {
        const foundTxsForNumber = transactions.flatMap(transaction => {
            const targetAmounts = getTargetAmounts(transaction);
            if (targetAmounts.filter(targetAmount => targetAmount.includes(search)).length === 0) {
                return [];
            }

            return transaction.txid;
        });
        txsToSearch.push(...foundTxsForNumber);
    }

    // Find by output label
    const foundTxsForOutputLabel = typedObjectKeys(txidsByOutputLabel).flatMap(label => {
        if (label.toLowerCase().includes(lowerCaseSearch)) {
            return txidsByOutputLabel[label] ?? [];
        }

        return [];
    });
    txsToSearch.push(...foundTxsForOutputLabel);

    // Find by address label
    const foundAddressesForLabel = new Set(
        typedObjectKeys(addressesByLabel).flatMap(label => {
            if (label.toLowerCase().includes(lowerCaseSearch)) {
                return addressesByLabel[label] ?? [];
            }

            return [];
        }),
    );

    // Find by address
    const foundTxsForAddress = typedObjectKeys(txidsByAddress).flatMap(address => {
        if (
            address.toLowerCase().includes(lowerCaseSearch) ||
            foundAddressesForLabel.has(address)
        ) {
            return [...(txidsByAddress[address] ?? [])];
        }

        return [];
    });
    txsToSearch.push(...foundTxsForAddress);

    // Find by token name, symbol or contract
    const foundTxsForToken = transactions.flatMap(transaction => {
        const isNativeSymbolSearch = isNativeDisplaySymbolSearch(
            transaction.symbol,
            lowerCaseSearch,
        );
        const hasMatchingToken = transaction.tokens.some(
            token =>
                (isNativeSymbolSearch
                    ? token.symbol?.toLowerCase() === lowerCaseSearch
                    : isTokenTransferMatchesSearch(token, lowerCaseSearch)) ||
                token.to?.toLowerCase().includes(lowerCaseSearch) ||
                token.from?.toLowerCase().includes(lowerCaseSearch),
        );

        if (hasMatchingToken) {
            return transaction.txid;
        }

        return [];
    });
    txsToSearch.push(...foundTxsForToken);

    // Find by native coin symbol
    const foundTxsForNativeSymbol = transactions.flatMap(transaction => {
        if (isNativeTransferMatchesSearch(transaction, lowerCaseSearch)) {
            return transaction.txid;
        }

        return [];
    });
    txsToSearch.push(...foundTxsForNativeSymbol);

    // Find by evm parsed function selector
    const foundTxsForFunctionSelector = transactions.flatMap(transaction => {
        const hasMatchingFunctionSelector =
            transaction.ethereumSpecific &&
            isFunctionSelectorMatchesSearch(transaction.ethereumSpecific, lowerCaseSearch);

        if (hasMatchingFunctionSelector) {
            return transaction.txid;
        }

        return [];
    });
    txsToSearch.push(...foundTxsForFunctionSelector);

    // Remove duplicate txIDs
    const foundTxIds = new Set(txsToSearch);

    return transactions.filter(t => foundTxIds.has(t.txid) || t.txid.includes(search));
};
