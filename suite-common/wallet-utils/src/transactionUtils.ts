import BigNumber from 'bignumber.js';
import { fromWei } from 'web3-utils';

import {
    Account,
    RbfTransactionParams,
    WalletAccountTransaction,
} from '@suite-common/wallet-types';
import { AccountMetadata } from '@suite-common/metadata-types';
import { AccountAddress, AccountTransaction } from '@trezor/connect';

import { formatAmount, formatNetworkAmount } from './accountUtils';
import { toFiatCurrency } from './fiatConverterUtils';

export const sortByBlockHeight = (a: { blockHeight?: number }, b: { blockHeight?: number }) => {
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
 * Returns transactions for the active account that have been fetched so far.
 * The list is not sorted here because it may contain null values as placeholders
 * for transactions that have not been fetched yet. (This affects pagination.)
 */
export const getAccountTransactions = (
    accountKey: string,
    transactions: Record<string, WalletAccountTransaction[]>,
) => transactions[accountKey] || [];

export const isPending = (tx: WalletAccountTransaction | AccountTransaction) =>
    !!tx && (!tx.blockHeight || tx.blockHeight < 0);

/* Convert date to string in YYYY-MM-DD format */
const generateTransactionDateKey = (d: Date) =>
    `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

/** Parse Date object from a string in YYYY-MM-DD format */
export const parseTransactionDateKey = (key: string) => {
    const [year, month, day] = key.split('-');
    return new Date(Number(year), Number(month) - 1, Number(day));
};

export type MonthKey = string & { __type: 'MonthKey' };

/* Convert date to string in YYYY-MM format */
const generateTransactionMonthKey = (d: Date): MonthKey =>
    `${d.getFullYear()}-${d.getMonth() + 1}` as MonthKey;

/** Parse Date object from a string in YYYY-MM format to return localized month name */
export const parseTransactionMonthKey = (key: MonthKey): Date => {
    const [year, month] = key.split('-');
    return new Date(Number(year), Number(month) - 1);
};

/**
 * Returns object with transactions grouped by a date. Key is a string in YYYY-MM-DD format.
 * Pending txs are assigned to key 'pending'.
 *
 * @param {WalletAccountTransaction[]} transactions
 */
export const groupTransactionsByDate = (
    transactions: WalletAccountTransaction[],
    groupBy: 'day' | 'month' = 'day',
) => {
    // Note: We should use ts-belt for sorting this array but currently, there can be undefined inside
    // Built-in sort doesn't include undefined elements but ts-belt does so there will be some refactoring involved.
    const keyFormatter =
        groupBy === 'day' ? generateTransactionDateKey : generateTransactionMonthKey;
    return (
        [...transactions]
            // There could be some undefined/null in array, not sure how it happens. Maybe related to pagination?
            .filter(transaction => !!transaction)
            .sort(sortByBlockHeight)
            .reduce<{ [key: string]: WalletAccountTransaction[] }>((r, item) => {
                const key =
                    item.blockHeight && item.blockHeight > 0 && item.blockTime && item.blockTime > 0
                        ? keyFormatter(new Date(item.blockTime * 1000))
                        : 'pending';
                const prev = r[key] ?? [];
                return {
                    ...r,
                    [key]: [...prev, item],
                };
            }, {})
    );
};

export const groupJointTransactions = (transactions: WalletAccountTransaction[]) =>
    transactions
        .reduce<WalletAccountTransaction[][]>((prev, tx) => {
            const last = prev.pop();
            if (!last) return [[tx]];
            return tx.type === 'joint' && last[0].type === 'joint'
                ? [...prev, [...last, tx]]
                : [...prev, last, [tx]];
        }, [])
        .map(txs =>
            txs.length > 1
                ? ({ type: 'joint-batch', rounds: txs } as const)
                : ({ type: 'single-tx', tx: txs[0] } as const),
        );

export const formatCardanoWithdrawal = (tx: WalletAccountTransaction) =>
    tx.cardanoSpecific?.withdrawal
        ? formatNetworkAmount(tx.cardanoSpecific.withdrawal, tx.symbol)
        : undefined;

export const formatCardanoDeposit = (tx: WalletAccountTransaction) =>
    tx.cardanoSpecific?.deposit
        ? formatNetworkAmount(tx.cardanoSpecific.deposit, tx.symbol)
        : undefined;

/**
 * Returns a sum of sent/recv txs amounts as a BigNumber.
 * Amounts of sent transactions are added, amounts of recv transactions are subtracted
 *
 * @param {WalletAccountTransaction[]} transactions
 */
export const sumTransactions = (transactions: WalletAccountTransaction[]) => {
    let totalAmount = new BigNumber(0);
    transactions.forEach(tx => {
        const amount = formatNetworkAmount(tx.amount, tx.symbol);
        const fee = formatNetworkAmount(tx.fee, tx.symbol);

        if (tx.type === 'self') {
            // in sent to self tx all we spent is just a fee
            // (tx.amount is set to the fee in blockchain-link)
            totalAmount = totalAmount.minus(fee);

            const cardanoWithdrawal = formatCardanoWithdrawal(tx);
            if (cardanoWithdrawal) {
                totalAmount = totalAmount.plus(cardanoWithdrawal);
            }

            const cardanoDeposit = formatCardanoDeposit(tx);
            if (cardanoDeposit) {
                totalAmount = totalAmount.minus(cardanoDeposit);
            }
        }

        if (tx.type === 'sent') {
            totalAmount = totalAmount.minus(amount);
            totalAmount = totalAmount.minus(fee);
        }
        if (tx.type === 'recv' || tx.type === 'joint') {
            totalAmount = totalAmount.plus(amount);
        }
        if (tx.type === 'failed') {
            totalAmount = totalAmount.minus(fee);
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
        const amount = formatNetworkAmount(tx.amount, tx.symbol);
        const fee = formatNetworkAmount(tx.fee, tx.symbol);

        if (tx.type === 'self') {
            // in sent to self tx all we spent is just a fee
            // (tx.amount is set to the fee in blockchain-link)
            totalAmount = totalAmount.minus(toFiatCurrency(fee, fiatCurrency, tx.rates, -1) ?? 0);

            const cardanoWithdrawal = formatCardanoWithdrawal(tx);
            if (cardanoWithdrawal) {
                totalAmount = totalAmount.plus(
                    toFiatCurrency(cardanoWithdrawal, fiatCurrency, tx.rates, -1) ?? 0,
                );
            }

            const cardanoDeposit = formatCardanoDeposit(tx);
            if (cardanoDeposit) {
                totalAmount = totalAmount.minus(
                    toFiatCurrency(cardanoDeposit, fiatCurrency, tx.rates, -1) ?? 0,
                );
            }
        }
        if (tx.type === 'sent') {
            totalAmount = totalAmount.minus(
                toFiatCurrency(amount, fiatCurrency, tx.rates, -1) ?? 0,
            );
            totalAmount = totalAmount.minus(toFiatCurrency(fee, fiatCurrency, tx.rates, -1) ?? 0);
        }
        if (tx.type === 'recv' || tx.type === 'joint') {
            totalAmount = totalAmount.plus(toFiatCurrency(amount, fiatCurrency, tx.rates, -1) ?? 0);
        }
        if (tx.type === 'failed') {
            totalAmount = totalAmount.minus(toFiatCurrency(fee, fiatCurrency, tx.rates, -1) ?? 0);
        }
    });
    return totalAmount;
};

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
    remove: AccountTransaction[];
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

export const analyzeTransactions = (fresh: AccountTransaction[], known: AccountTransaction[]) => {
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

    // make sure the known transactions are sorted properly
    const knownSorted = known.filter(tx => tx != null).sort(sortByBlockHeight);

    // run thru all fresh txs
    fresh.forEach((tx, i) => {
        const height = tx.blockHeight;
        const isLast = i + 1 === fresh.length;
        if (!height || height <= 0) {
            // add pending tx
            addTxs.push(tx);
        } else {
            let index = firstKnownIndex;
            const len = knownSorted.length;
            // use simple for loop to have possibility to `break`
            for (index; index < len; index++) {
                const kTx = knownSorted[index];
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
        remove: knownSorted.slice(0, sliceIndex),
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
        case 'joint':
            return 'SHUFFLE';
        default:
            return 'QUESTION';
    }
};

export const getTargetAmount = (
    target: WalletAccountTransaction['targets'][number] | undefined,
    transaction: WalletAccountTransaction,
) => {
    const txAmount = formatNetworkAmount(transaction.amount, transaction.symbol);
    const validTxAmount = txAmount && txAmount !== '0';
    if (!target) {
        return validTxAmount ? txAmount : null;
    }

    const sentToSelfTarget =
        (transaction.type === 'sent' || transaction.type === 'self') && target.isAccountTarget;

    const amount = target.amount && formatNetworkAmount(target.amount, transaction.symbol);
    const validTargetAmount = amount && amount !== '0';
    if (!sentToSelfTarget && validTargetAmount) {
        // show target amount for all non "sent to myself" targets
        return amount;
    }

    if (
        target === transaction.targets.find(t => t.isAccountTarget) &&
        !transaction.targets.find(t => !t.isAccountTarget) &&
        validTxAmount
    ) {
        // "sent to self" target, if it is first of its type and there are no other non-self targets show a fee
        return txAmount;
    }

    // "sent to self" target while other non-self targets are also present
    return null;
};

export const isTxUnknown = (transaction: WalletAccountTransaction) => {
    // blockbook cannot parse some txs
    // eg. tx with eth smart contract that creates a new token has no valid target
    const isTokenTransaction = transaction.tokens.length > 0;
    return (
        (!isTokenTransaction &&
            transaction.type !== 'joint' && // coinjoin txs don't have any target
            !transaction.cardanoSpecific && // cardano staking txs (de/registration of staking key, stake delegation) don't need to have any target
            !transaction.targets.find(t => t.addresses)) ||
        transaction.type === 'unknown'
    );
};

export const isTxFailed = (tx: AccountTransaction | WalletAccountTransaction) =>
    !isPending(tx) && tx.ethereumSpecific?.status === 0;

export const getFeeRate = (tx: AccountTransaction) =>
    // calculate fee rate, TODO: add this to blockchain-link tx details
    new BigNumber(tx.fee).div(tx.details.size).integerValue(BigNumber.ROUND_CEIL).toString();

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
            // TODO: this should be done in @trezor/connect, blockchain-link or even blockbook
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

    // TODO: get other params, like locktime etc.
    return {
        txid: tx.txid,
        utxo,
        outputs,
        changeAddress,
        // fee rate is calculated in blockchain-link but only for newer versions of blockbook. users
        // that have old transactions saved in their database might not have this data so legacy way
        // of displaying fee rate is kept here
        feeRate: tx.feeRate || getFeeRate(tx),
        baseFee: parseInt(tx.fee, 10),
    };
};

export const getRbfParams = (
    tx: AccountTransaction,
    account: Account,
): WalletAccountTransaction['rbfParams'] =>
    getBitcoinRbfParams(tx, account) || getEthereumRbfParams(tx, account);

/**
 * Attaches fields from the account (descriptor, deviceState, symbol) to the tx object
 *
 * @param {AccountTransaction} tx
 * @param {Account} account
 * @returns {WalletAccountTransaction}
 */
export const enhanceTransaction = (
    origTx: AccountTransaction,
    account: Account,
): WalletAccountTransaction => {
    const tx = {
        ...origTx,
        type: isTxFailed(origTx) ? 'failed' : origTx.type,
    };
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
        rbfParams: getRbfParams(tx, account),
    };
};

export const getOriginalTransaction = ({
    descriptor,
    deviceState,
    symbol,
    rbfParams,
    rates,
    ...tx
}: WalletAccountTransaction): AccountTransaction => tx;

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
        ? [formatNetworkAmount(transaction.amount, transaction.symbol)]
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

export const getTxHeaderSymbol = (transaction: WalletAccountTransaction) => {
    const isSingleTokenTransaction = transaction.tokens.length === 1;
    const transfer = transaction.tokens[0];
    // In case of single token transactions show the token symbol instead of symbol of a main network
    const symbol = !isSingleTokenTransaction || !transfer ? transaction.symbol : transfer.symbol;

    return symbol;
};
