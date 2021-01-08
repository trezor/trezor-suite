import BigNumber from 'bignumber.js';
import { AccountTransaction } from 'trezor-connect';
import { Account, WalletAccountTransaction } from '@wallet-types';
import { AccountMetadata } from '@suite-types/metadata';
import { getDateWithTimeZone } from '../suite/date';
import { toFiatCurrency } from './fiatConverterUtils';
import { formatAmount, formatNetworkAmount } from './accountUtils';
import { tr } from 'date-fns/locale';

export const sortByBlockHeight = (a: WalletAccountTransaction, b: WalletAccountTransaction) => {
    // if both are missing the blockHeight don't change their order
    const blockA = (a.blockHeight || 0) > 0 ? a.blockHeight : 0;
    const blockB = (b.blockHeight || 0) > 0 ? b.blockHeight : 0;
    if (!blockA && !blockB) return 0;
    // tx with no blockHeight comes first
    if (!blockA) return -1;
    if (!blockB) return 1;
    return blockB - blockA;
};

/**
 * Returns object with transactions grouped by a date. Key is a string in YYYY-MM-DD format.
 * Pending txs are assigned to key 'pending'.
 *
 * @param {WalletAccountTransaction[]} transactions
 */
export const groupTransactionsByDate = (
    transactions: WalletAccountTransaction[],
): { [key: string]: WalletAccountTransaction[] } => {
    const r: { [key: string]: WalletAccountTransaction[] } = {};
    const sortedTxs = transactions.sort((a, b) => sortByBlockHeight(a, b));
    sortedTxs.sort(sortByBlockHeight).forEach(item => {
        let key = 'pending';
        if (item.blockHeight && item.blockHeight > 0 && item.blockTime && item.blockTime > 0) {
            const t = item.blockTime * 1000;
            const d = getDateWithTimeZone(t);
            if (d) {
                // YYYY-MM-DD format
                key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
            } else {
                console.log(
                    `Error during grouping transaction by date. Failed timestamp conversion (${t})`,
                );
            }
        }
        if (!r[key]) {
            r[key] = [];
        }
        r[key].push(item);
    });
    return r;
};

/**
 * Returns a sum of sent/recv txs amounts as a BigNumber.
 * Amounts of sent transactions are added, amounts of recv transactions are subtracted
 *
 * @param {WalletAccountTransaction[]} transactions
 */
export const sumTransactions = (transactions: WalletAccountTransaction[]) => {
    let totalAmount = new BigNumber(0);
    transactions.forEach(tx => {
        // count only recv/sent txs
        if (tx.type === 'sent') {
            totalAmount = totalAmount.minus(tx.amount).minus(tx.fee);
        }
        if (tx.type === 'recv') {
            totalAmount = totalAmount.plus(tx.amount);
        }
    });
    return totalAmount;
};

export const sumTransactionsFiat = (
    transactions: WalletAccountTransaction[],
    fiatCurrency: string,
) => {
    let totalAmount = new BigNumber(0);
    transactions.forEach(tx => {
        // count only recv/sent txs
        if (tx.type === 'sent') {
            totalAmount = totalAmount
                .minus(toFiatCurrency(tx.amount, fiatCurrency, tx.rates, -1) ?? 0)
                .minus(toFiatCurrency(tx.fee, fiatCurrency, tx.rates, -1) ?? 0);
        }
        if (tx.type === 'recv') {
            totalAmount = totalAmount.plus(
                toFiatCurrency(tx.amount, fiatCurrency, tx.rates, -1) ?? 0,
            );
        }
    });
    return totalAmount;
};

/**
 * Parse Date object from a string in YYYY-MM-DD format.
 *
 * @param {string} key
 */
export const parseKey = (key: string) => {
    const parts = key.split('-');
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d;
};

export const findTransaction = (txid: string, transactions: WalletAccountTransaction[]) =>
    transactions.find(t => t && t.txid === txid);

export const findTransactions = (
    txid: string,
    transactions: { [key: string]: WalletAccountTransaction[] },
) => {
    return Object.keys(transactions).flatMap(key => {
        const tx = findTransaction(txid, transactions[key]);
        if (!tx) return [];
        return [{ key, tx }];
    });
};

export const isPending = (tx: WalletAccountTransaction | AccountTransaction) =>
    !tx.blockHeight || tx.blockHeight < 0;

export const getConfirmations = (
    tx: WalletAccountTransaction | AccountTransaction,
    height: number,
) => {
    return tx.blockHeight && tx.blockHeight > 0 ? height - tx.blockHeight + 1 : 0;
};

// inner private type, it's pointless to move it outside of this file
interface Analyze {
    newTransactions: AccountTransaction[];
    add: AccountTransaction[];
    remove: WalletAccountTransaction[];
}

const filterAnalyzeResult = (result: Analyze) => {
    // to avoid unnecessary adding/removing the same pending transactions
    // check if tx which exist in 'remove' has own replacement in 'add' (txid && blockHeight are the same)
    const preserve = result.remove.filter(tx =>
        result.add.find(a => a.txid === tx.txid && a.blockHeight === tx.blockHeight),
    );

    if (!preserve.length) return result;

    return {
        newTransactions: result.newTransactions,
        add: result.add.filter(a => !preserve.find(tx => tx.txid === a.txid)),
        remove: result.remove.filter(a => !preserve.find(tx => tx.txid === a.txid)),
    };
};

export const analyzeTransactions = (
    fresh: AccountTransaction[],
    known: WalletAccountTransaction[],
) => {
    let addTxs: AccountTransaction[] = [];
    const newTxs: AccountTransaction[] = [];
    let firstKnownIndex = 0;
    let sliceIndex = 0;

    // No fresh info
    // remove all known
    if (fresh.length < 1) {
        return {
            newTransactions: [],
            add: [],
            remove: known,
        };
    }

    // If there are no known confirmed txs
    // remove all known and add all fresh
    const gotConfirmedTxs = known.some(tx => !isPending(tx));
    if (!gotConfirmedTxs) {
        return filterAnalyzeResult({
            newTransactions: fresh.filter(tx => !isPending(tx)),
            add: fresh,
            remove: known,
        });
    }

    // run thru all fresh txs
    fresh.forEach((tx, i) => {
        const height = tx.blockHeight;
        const isLast = i + 1 === fresh.length;
        if (!height || height <= 0) {
            // add pending tx
            addTxs.push(tx);
        } else {
            let index = firstKnownIndex;
            const len = known.length;
            // use simple for loop to have possibility to `break`
            for (index; index < len; index++) {
                const kTx = known[index];
                // known tx is pending, it will be removed
                // move sliceIndex, set firstKnownIndex
                if (isPending(kTx)) {
                    firstKnownIndex = index + 1;
                    sliceIndex = index + 1;
                }
                // known tx is "older"
                if (!isPending(kTx) && kTx.blockHeight! < height) {
                    // set sliceIndex
                    sliceIndex = isLast ? len : index;
                    // all fresh txs to this point needs to be added
                    addTxs = fresh.slice(0, i + 1);
                    // this fresh tx is brand new
                    newTxs.push(tx);
                    break;
                }
                // known tx is on the same height
                if (kTx.blockHeight === height) {
                    firstKnownIndex = index + 1;
                    // known tx changed (rollback)
                    if (kTx.blockHash !== tx.blockHash) {
                        // set sliceIndex
                        sliceIndex = isLast ? len : index + 1;
                        // this fresh tx is not new but needs to be added (replace kTx)
                        addTxs.push(tx);
                    }
                    break;
                }
            }
        }
    });

    return filterAnalyzeResult({
        newTransactions: newTxs,
        add: addTxs,
        remove: known.slice(0, sliceIndex),
    });
};

export const getTxOperation = (transaction: WalletAccountTransaction) => {
    if (transaction.type === 'sent' || transaction.type === 'self') {
        return 'neg';
    }
    if (transaction.type === 'recv') {
        return 'pos';
    }
    return null;
};

export const getTargetAmount = (
    target: WalletAccountTransaction['targets'][number],
    transaction: WalletAccountTransaction,
) => {
    const isLocalTarget =
        (transaction.type === 'sent' || transaction.type === 'self') && target.isAccountTarget;
    const hasAmount = !isLocalTarget && typeof target.amount === 'string' && target.amount !== '0';
    const targetAmount =
        (hasAmount ? target.amount : null) ||
        (target === transaction.targets[0] &&
        typeof transaction.amount === 'string' &&
        transaction.amount !== '0'
            ? transaction.amount
            : null);
    return targetAmount;
};

export const isTxUnknown = (transaction: WalletAccountTransaction) => {
    // blockbook cannot parse some txs
    // eg. tx with eth smart contract that creates a new token has no valid target
    const isTokenTransaction = transaction.tokens.length > 0;
    return (
        (!isTokenTransaction && !transaction.targets.find(t => t.addresses)) ||
        transaction.type === 'unknown'
    );
};

const getRbfParams = (tx: AccountTransaction, account: Account) => {
    if (account.networkType !== 'bitcoin') return;
    if (tx.type === 'recv' || !tx.rbf || !tx.details || !isPending(tx)) return; // ignore non rbf and mined transactions
    const { vin, vout } = tx.details;

    const changeAddresses = account.addresses ? account.addresses.change : [];
    const allAddresses = account.addresses
        ? changeAddresses.concat(account.addresses.used).concat(account.addresses.unused)
        : [];
    const utxo = vin.flatMap(input => {
        // find input AccountAddress
        const addr = allAddresses.find(a => input.addresses?.includes(a.address));
        if (!addr) return []; // skip utxo, TODO: set some error? is it even possible?
        // re-create utxo from the input
        return [
            {
                amount: input.value!,
                txid: input.txid!,
                vout: input.vout || 0,
                address: addr!.address,
                path: addr!.path,
                blockHeight: 0,
                confirmations: 0,
            },
        ];
    });
    // find all change outputs
    const changeVout = vout.filter(output =>
        changeAddresses.find(a => output.addresses?.includes(a.address)),
    );
    // no change output found, there is no possibility to bump fee
    // TODO: implement possibility to add another utxo (sign totally different transaction)
    if (!changeVout.length) return;
    // re-create external outputs
    const outputs = vout
        .filter(output => !changeVout.includes(output))
        .map(output => ({
            address: output.addresses![0],
            amount: formatNetworkAmount(output.value!, account.symbol), // needs to be converted to be used in sedFormActions
        }));

    // no external outputs (opreturn)
    if (!outputs.length) return;

    // calculate fee rate, TODO: add this to blockchain-link tx details
    const feeRate = new BigNumber(tx.fee)
        .div(tx.details.size)
        .integerValue(BigNumber.ROUND_CEIL)
        .toString();

    // TODO: get other params, like opreturn or locktime? change etc.
    return {
        utxo,
        outputs,
        feeRate,
        baseFee: parseInt(tx.fee, 10),
    };
};

/**
 * Formats amounts and attaches fields from the account (descriptor, deviceState, symbol) to the tx object
 *
 * @param {AccountTransaction} tx
 * @param {Account} account
 * @returns {WalletAccountTransaction}
 */
export const enhanceTransaction = (
    tx: AccountTransaction,
    account: Account,
): WalletAccountTransaction => {
    return {
        descriptor: account.descriptor,
        deviceState: account.deviceState,
        symbol: account.symbol,
        ...tx,
        // https://bitcoin.stackexchange.com/questions/23061/ripple-ledger-time-format/23065#23065
        blockTime:
            account.networkType === 'ripple' && tx.blockTime
                ? tx.blockTime + 946684800
                : tx.blockTime,
        tokens: tx.tokens.map(tok => {
            return {
                ...tok,
                amount: formatAmount(tok.amount, tok.decimals),
            };
        }),
        amount: formatNetworkAmount(tx.amount, account.symbol),
        fee: formatNetworkAmount(tx.fee, account.symbol),
        targets: tx.targets.map(tr => {
            if (typeof tr.amount === 'string') {
                return {
                    ...tr,
                    amount: formatNetworkAmount(tr.amount, account.symbol),
                };
            }
            return tr;
        }),
        rbfParams: getRbfParams(tx, account),
    };
};

// TODO: Cache result
const groupTransactionIdsByAddress = (transactions: WalletAccountTransaction[]) => {
    const addresses: { [address: string]: string[] } = {};

    transactions.forEach(t => {
        t.targets.forEach(target => {
            target.addresses?.forEach(address => {
                if (!addresses[address]) {
                    addresses[address] = [];
                }

                addresses[address].push(t.txid);
            });
        });
    });

    return addresses;
};

const groupTransactionsByLabel = (accountMetadata: AccountMetadata) => {
    const labels: { [label: string]: string[] } = {};
    const { outputLabels } = accountMetadata;

    Object.keys(outputLabels).forEach(txid => {
        Object.values(outputLabels[txid]).forEach(label => {
            if (!labels[label]) {
                labels[label] = [];
            }

            labels[label].push(txid);
        });
    });

    return labels;
};

const groupAddressesByLabel = (accountMetadata: AccountMetadata) => {
    const labels: { [label: string]: string[] } = {};
    const { addressLabels } = accountMetadata;

    Object.keys(addressLabels).forEach(address => {
        const label = addressLabels[address];

        if (!labels[label]) {
            labels[label] = [];
        }

        labels[label].push(address);
    });

    return labels;
};

const searchOperators = ['<', '>', '=', '!='] as const;
const numberSearchFilter = (
    transaction: WalletAccountTransaction,
    amount: BigNumber,
    operator: typeof searchOperators[number],
) => {
    const targetAmount = getTargetAmount(transaction.targets[0], transaction);
    if (!targetAmount) {
        return false;
    }

    const op = getTxOperation(transaction);
    if (!op) {
        return false;
    }

    let bnTargetAmount = new BigNumber(targetAmount);
    if (op === 'neg') {
        bnTargetAmount = bnTargetAmount.negated();
    }

    switch (operator) {
        case '<':
            return bnTargetAmount.lte(amount);
        case '>':
            return bnTargetAmount.gte(amount);
        case '=':
            return bnTargetAmount.eq(amount);
        case '!=':
            return !bnTargetAmount.eq(amount);
        // no default
    }
};

const searchDateRegex = new RegExp(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/);
export const simpleSearchTransactions = (
    transactions: WalletAccountTransaction[],
    accountMetadata: AccountMetadata,
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
        const foundTxsForNumber = transactions.flatMap(t => {
            const targetAmount = getTargetAmount(t.targets[0], t);
            if (!targetAmount || !targetAmount.includes(search)) {
                return [];
            }
            return t.txid;
        });
        txsToSearch.push(...foundTxsForNumber);
    }

    // Find by output label
    const txsForOutputLabels = groupTransactionsByLabel(accountMetadata);
    const foundTxsForOutputLabel = Object.keys(txsForOutputLabels).flatMap(label => {
        if (label.toLowerCase().includes(search.toLowerCase())) {
            return txsForOutputLabels[label];
        }

        return [];
    });
    txsToSearch.push(...foundTxsForOutputLabel);

    // Find by address label
    const addressesForLabel = groupAddressesByLabel(accountMetadata);
    const foundAddressesForLabel = Object.keys(addressesForLabel).flatMap(label => {
        if (label.toLowerCase().includes(search.toLowerCase())) {
            return addressesForLabel[label];
        }

        return [];
    });

    // Find by address
    const txsForAddresses = groupTransactionIdsByAddress(transactions);
    const foundTxsForAddress = Object.keys(txsForAddresses).flatMap(address => {
        if (
            address.toLowerCase().includes(search.toLowerCase()) ||
            foundAddressesForLabel.includes(address)
        ) {
            return txsForAddresses[address];
        }

        return [];
    });
    txsToSearch.push(...foundTxsForAddress);

    // Remove duplicate txIDs
    return transactions.filter(
        t => [...new Set(txsToSearch)].includes(t.txid) || t.txid.includes(search),
    );
};

export const advancedSearchTransactions = (
    transactions: WalletAccountTransaction[],
    accountMetadata: AccountMetadata,
    search: string,
) => {
    // No AND/OR operators, just run a simple search
    if (!search.includes('&') && !search.includes('|')) {
        return simpleSearchTransactions(transactions, accountMetadata, search);
    }

    // Split by OR operator first
    let orSplit = search.split('|').filter(s => s.trim() !== '');
    if (!orSplit || orSplit.length === 1) {
        orSplit = [search.replace('|', '')];
    }

    // Get all TxIDs matching the searches
    const filteredTxIDs = new Set([
        ...orSplit.flatMap(or => {
            // And searches (only keep results that appear X (split) times)
            const andSplit = or.split('&');
            if (!andSplit || andSplit.length === 1) {
                return simpleSearchTransactions(
                    transactions,
                    accountMetadata,
                    or.replace('&', ''),
                ).flatMap(t => t.txid);
            }

            const andTxs = andSplit.flatMap(and =>
                simpleSearchTransactions(transactions, accountMetadata, and).map(t => t.txid),
            );

            const transactionCount: { [txid: string]: number } = {};
            return andTxs.filter(txid => {
                if (!transactionCount[txid]) {
                    transactionCount[txid] = 0;
                }

                transactionCount[txid]++;

                return transactionCount[txid] === andSplit.length;
            });
        }),
    ]);

    return transactions.filter(t => filteredTxIDs.has(t.txid));
};
