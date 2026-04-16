import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { isTokenTransferMatchesSearch } from '@suite-common/wallet-utils';
import { BigNumber, typedObjectKeys } from '@trezor/utils';

import { getTargetAmounts } from './getTargetAmounts';
import { numberSearchFilter } from './numberSearchFilter';
import { type SearchAccountLabels } from './searchLabels';
import { searchOperators } from './searchOperations';

const searchDateRegex = new RegExp(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/);

const groupTransactionIdsByAddress = (transactions: WalletAccountTransaction[]) => {
    const addresses: Record<string, string[]> = {};
    const addAddress = (txid: string, addrs: string[] | undefined) => {
        if (!addrs) {
            return;
        }

        addrs.forEach(address => {
            if (!addresses[address]) {
                addresses[address] = [];
            }

            if (addresses[address].indexOf(txid) === -1) {
                addresses[address].push(txid);
            }
        });
    };

    transactions.forEach(t => {
        // Inputs
        t.details.vin.forEach(vin => addAddress(t.txid, vin.addresses));
        // Outputs
        t.details.vout.forEach(vout => addAddress(t.txid, vout.addresses));
        // Targets
        t.targets.forEach(target => addAddress(t.txid, target.addresses));
    });

    return addresses;
};

const groupTransactionsByLabel = (accountLabels: SearchAccountLabels) => {
    const labels: Record<string, string[]> = {};
    const { outputLabels } = accountLabels;

    outputLabels.forEach((accountOutputLabels, txid) => {
        accountOutputLabels.forEach(label => {
            if (!labels[label]) {
                labels[label] = [];
            }

            labels[label].push(txid);
        });
    });

    return labels;
};

const groupAddressesByLabel = (accountLabels: SearchAccountLabels) => {
    const labels: Record<string, string[]> = {};
    const { addressLabels } = accountLabels;

    addressLabels.forEach((label, address) => {
        if (!labels[label]) {
            labels[label] = [];
        }

        labels[label].push(address);
    });

    return labels;
};

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
        if (!Number.isNaN(search)) {
            const amount = new BigNumber(search);

            return transactions.filter(t => numberSearchFilter(t, amount, searchOperator));
        }

        return [];
    }

    const txsToSearch: string[] = [];

    // Searching for an amount (without operator)
    if (!Number.isNaN(search)) {
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
    const txsForOutputLabels = groupTransactionsByLabel(accountLabels);
    const foundTxsForOutputLabel = typedObjectKeys(txsForOutputLabels).flatMap(label => {
        if (label.toLowerCase().includes(search.toLowerCase())) {
            return txsForOutputLabels[label] ?? [];
        }

        return [];
    });
    txsToSearch.push(...foundTxsForOutputLabel);

    // Find by address label
    const addressesForLabel = groupAddressesByLabel(accountLabels);
    const foundAddressesForLabel = typedObjectKeys(addressesForLabel).flatMap(label => {
        if (label.toLowerCase().includes(search.toLowerCase())) {
            return addressesForLabel[label];
        }

        return [];
    });

    // Find by address
    const txsForAddresses = groupTransactionIdsByAddress(transactions);
    const foundTxsForAddress = typedObjectKeys(txsForAddresses).flatMap(address => {
        if (
            address.toLowerCase().includes(search.toLowerCase()) ||
            foundAddressesForLabel.includes(address)
        ) {
            return txsForAddresses[address] ?? [];
        }

        return [];
    });
    txsToSearch.push(...foundTxsForAddress);

    // Find by token name, symbol or contract
    const foundTxsForToken = transactions.flatMap(transaction => {
        const hasMatchingToken = transaction.tokens.some(
            token =>
                isTokenTransferMatchesSearch(token, search.toLowerCase()) ||
                token.to?.toLowerCase().includes(search.toLowerCase()) ||
                token.from?.toLowerCase().includes(search.toLowerCase()),
        );

        if (hasMatchingToken) {
            return transaction.txid;
        }

        return [];
    });
    txsToSearch.push(...foundTxsForToken);

    // Remove duplicate txIDs
    return transactions.filter(
        t => [...new Set(txsToSearch)].includes(t.txid) || t.txid.includes(search),
    );
};
