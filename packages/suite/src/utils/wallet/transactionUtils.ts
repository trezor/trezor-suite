import BigNumber from 'bignumber.js';
import { AccountTransaction, AccountAddress } from 'trezor-connect';
import { fromWei } from 'web3-utils';
import { Account, WalletAccountTransaction, RbfTransactionParams } from '@wallet-types';
import { AccountMetadata } from '@suite-types/metadata';
import { toFiatCurrency } from './fiatConverterUtils';
import { formatAmount, formatNetworkAmount, amountToSatoshi } from './accountUtils';

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
            const d = new Date(t);
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
        if (tx.type === 'sent' || tx.type === 'self') {
            totalAmount = totalAmount.minus(tx.amount);
            totalAmount = totalAmount.minus(tx.fee);
        }
        if (tx.type === 'recv') {
            totalAmount = totalAmount.plus(tx.amount);
        }
        if (tx.type === 'failed') {
            totalAmount = totalAmount.minus(tx.fee);
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
        if (tx.type === 'sent' || tx.type === 'self') {
            totalAmount = totalAmount.minus(
                toFiatCurrency(tx.amount, fiatCurrency, tx.rates, -1) ?? 0,
            );
            totalAmount = totalAmount.minus(
                toFiatCurrency(tx.fee, fiatCurrency, tx.rates, -1) ?? 0,
            );
        }
        if (tx.type === 'recv') {
            totalAmount = totalAmount.plus(
                toFiatCurrency(tx.amount, fiatCurrency, tx.rates, -1) ?? 0,
            );
        }
        if (tx.type === 'failed') {
            totalAmount = totalAmount.minus(
                toFiatCurrency(tx.fee, fiatCurrency, tx.rates, -1) ?? 0,
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

export const isPending = (tx: WalletAccountTransaction | AccountTransaction) =>
    !!tx && (!tx.blockHeight || tx.blockHeight < 0);

export const findTransaction = (txid: string, transactions: WalletAccountTransaction[]) =>
    transactions.find(t => t && t.txid === txid);

export const findTransactions = (
    txid: string,
    transactions: { [key: string]: WalletAccountTransaction[] },
) =>
    Object.keys(transactions).flatMap(key => {
        const tx = findTransaction(txid, transactions[key]);
        if (!tx) return [];
        return [{ key, tx }];
    });

// Find chained pending transactions
export const findChainedTransactions = (
    txid: string,
    transactions: { [key: string]: WalletAccountTransaction[] },
) =>
    Object.keys(transactions).flatMap(key => {
        // check if any pending transaction is using the utxo/vin with requested txid
        const txs = transactions[key]
            .filter(isPending)
            .filter(tx => tx.details.vin.find(i => i.txid === txid));
        if (!txs.length) return [];

        const result = [{ key, txs }];
        // each affected tx.vout can be used in another tx.vin
        // find recursively
        txs.forEach(tx => {
            const deep = findChainedTransactions(tx.txid, transactions);
            deep.forEach(dt => result.push(dt));
        });
        // merge result by key
        return result.reduce((res, item) => {
            const index = res.findIndex(t => t.key === item.key);
            if (index >= 0) {
                // remove duplicates
                const unique = item.txs.filter(t => !res[index].txs.find(tt => tt.txid === t.txid));
                res[index].txs = res[index].txs.concat(unique);
                return res;
            }
            return res.concat(item);
        }, [] as typeof result);
    });

export const getConfirmations = (
    tx: WalletAccountTransaction | AccountTransaction,
    height: number,
) => (tx.blockHeight && tx.blockHeight > 0 ? height - tx.blockHeight + 1 : 0);

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

// getTxOperation is used with types WalletAccountTransaction and ArrayElement<WalletAccountTransaction['tokens']
// the only interesting field is 'type', which has compatible string literal union in both types
export const getTxOperation = (tx: { type: WalletAccountTransaction['type'] }) => {
    if (tx.type === 'sent' || tx.type === 'self' || tx.type === 'failed') {
        return 'neg';
    }
    if (tx.type === 'recv') {
        return 'pos';
    }
    return null;
};

export const getTxIcon = (txType: WalletAccountTransaction['type']) => {
    switch (txType) {
        case 'recv':
            return 'RECEIVE';
        case 'sent':
        case 'self':
            return 'SEND';
        case 'failed':
            return 'CROSS';
        default:
            return 'QUESTION';
    }
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

export const isTxFailed = (tx: AccountTransaction | WalletAccountTransaction) =>
    !isPending(tx) && tx.ethereumSpecific?.status === 0;

export const getFeeRate = (tx: AccountTransaction, decimals?: number) => {
    // calculate fee rate, TODO: add this to blockchain-link tx details
    const fee = typeof decimals === 'number' ? amountToSatoshi(tx.fee, decimals) : tx.fee;
    return new BigNumber(fee).div(tx.details.size).integerValue(BigNumber.ROUND_CEIL).toString();
};

const getEthereumRbfParams = (
    tx: AccountTransaction,
    account: Account,
): RbfTransactionParams | undefined => {
    if (account.networkType !== 'ethereum') return;
    if (tx.type === 'recv' || !tx.ethereumSpecific || !isPending(tx)) return; // ignore non rbf and mined transactions

    const { vout } = tx.details;
    const token = tx.tokens[0];

    const output = token
        ? {
              address: token.to!,
              token: token.address,
              amount: token.amount,
              formattedAmount: formatAmount(token.amount, token.decimals),
          }
        : {
              address: vout[0].addresses![0],
              amount: vout[0].value!,
              formattedAmount: formatNetworkAmount(vout[0].value!, account.symbol),
          };

    const ethereumData =
        tx.ethereumSpecific.data && tx.ethereumSpecific.data.indexOf('0x') === 0
            ? tx.ethereumSpecific.data.substring(2)
            : '';

    return {
        txid: tx.txid,
        utxo: [], // irrelevant
        outputs: [
            {
                type: 'payment',
                ...output,
            },
        ],
        ethereumNonce: tx.ethereumSpecific.nonce,
        ethereumData,
        feeRate: fromWei(tx.ethereumSpecific.gasPrice, 'gwei'),
        baseFee: 0, // irrelevant
    };
};

const getBitcoinRbfParams = (
    tx: AccountTransaction,
    account: Account,
): RbfTransactionParams | undefined => {
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
        return {
            amount: input.value!,
            txid: input.txid!,
            vout: input.vout || 0,
            address: addr!.address,
            path: addr!.path,
            blockHeight: 0,
            confirmations: 0,
            required: true,
        };
    });
    // find change address and output
    let changeAddress: AccountAddress | undefined;
    const outputs: RbfTransactionParams['outputs'] = [];
    vout.forEach(output => {
        if (!output.isAddress) {
            // TODO: this should be done in trezor-connect, blockchain-link or even blockbook
            // blockbook sends output.hex as scriptPubKey with additional prefix where: 6a - OP_RETURN and XX - data len. this field should be parsed by @trezor/utxo-lib
            // blockbook sends ascii data in output.address[0] field in format: "OP_RETURN (ASCII-VALUE)". as a workaround we are extracting ascii data from here
            const dataAscii = output.addresses![0].match(/^OP_RETURN \((.*)\)/)?.pop(); // strip ASCII data from brackets
            if (dataAscii) {
                outputs.push({
                    type: 'opreturn',
                    dataHex: Buffer.from(dataAscii, 'ascii').toString('hex'),
                    dataAscii,
                });
            }
        } else {
            const changeOutput = changeAddresses.find(a => output.addresses?.includes(a.address));
            outputs.push({
                type: changeOutput ? 'change' : 'payment',
                address: output.addresses![0],
                amount: output.value!,
                formattedAmount: formatNetworkAmount(output.value!, account.symbol),
            });
            if (changeOutput) {
                changeAddress = changeOutput;
            }
        }
    });

    if (!utxo.length || !outputs.length || outputs.length !== vout.length) return;

    // calculate fee rate, TODO: add this to blockchain-link tx details
    const feeRate = getFeeRate(tx);

    // TODO: get other params, like locktime etc.
    return {
        txid: tx.txid,
        utxo,
        outputs,
        changeAddress,
        feeRate,
        baseFee: parseInt(tx.fee, 10),
    };
};

export const getRbfParams = (
    tx: AccountTransaction,
    account: Account,
): WalletAccountTransaction['rbfParams'] =>
    getBitcoinRbfParams(tx, account) || getEthereumRbfParams(tx, account);

export const enhanceTransactionDetails = (tx: AccountTransaction, symbol: Account['symbol']) => ({
    ...tx.details,
    vin: tx.details.vin.map(v => ({
        ...v,
        value: v.value ? formatNetworkAmount(v.value, symbol) : v.value,
    })),
    vout: tx.details.vout.map(v => ({
        ...v,
        value: v.value ? formatNetworkAmount(v.value, symbol) : v.value,
    })),
    totalInput: formatNetworkAmount(tx.details.totalInput, symbol),
    totalOutput: formatNetworkAmount(tx.details.totalOutput, symbol),
});

const enhanceFailedTransaction = (
    tx: AccountTransaction,
    _account: Account,
): AccountTransaction => {
    if (!isTxFailed(tx)) return tx;
    // const address = tx.targets[0].addresses![0];
    // TODO: find failed token in account.tokens list?
    // TODO: try to parse smart contract data to get values (destination, amount..)
    return {
        ...tx,
        type: 'failed',
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
    origTx: AccountTransaction,
    account: Account,
): WalletAccountTransaction => {
    const tx = enhanceFailedTransaction(origTx, account);
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
        tokens: tx.tokens.map(tok => ({
            ...tok,
            amount: formatAmount(tok.amount, tok.decimals),
        })),
        amount: formatNetworkAmount(tx.amount, account.symbol),
        fee: formatNetworkAmount(tx.fee, account.symbol),
        totalSpent: formatNetworkAmount(tx.totalSpent, account.symbol),
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
        details: enhanceTransactionDetails(tx, account.symbol),
        ethereumSpecific: tx.ethereumSpecific
            ? {
                  ...tx.ethereumSpecific,
                  gasPrice: fromWei(tx.ethereumSpecific.gasPrice, 'gwei'),
              }
            : undefined,
    };
};

const groupTransactionIdsByAddress = (transactions: WalletAccountTransaction[]) => {
    const addresses: { [address: string]: string[] } = {};
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

const getTargetAmounts = (transaction: WalletAccountTransaction) =>
    transaction.targets.length === 0
        ? [transaction.amount]
        : transaction.targets.flatMap(target => getTargetAmount(target, transaction) || []);

const searchOperators = ['<', '>', '=', '!='] as const;
const numberSearchFilter = (
    transaction: WalletAccountTransaction,
    amount: BigNumber,
    operator: typeof searchOperators[number],
) => {
    const targetAmounts = getTargetAmounts(transaction);
    const op = getTxOperation(transaction);
    if (!op) {
        return false;
    }

    return (
        targetAmounts.filter(targetAmount => {
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
                default:
                    return false;
            }
        }).length > 0
    );
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
            const targetAmounts = getTargetAmounts(t);
            if (targetAmounts.filter(targetAmount => targetAmount.includes(search)).length === 0) {
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

export const isTxFinal = (tx: WalletAccountTransaction, confirmations: number) =>
    // checks RBF status
    !tx.rbf || confirmations > 0;
