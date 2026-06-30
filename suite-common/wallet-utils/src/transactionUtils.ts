import { addDays, startOfMonth } from 'date-fns';

import { Calldata } from '@suite-common/calldata';
import { type SignOperator } from '@suite-common/suite-types';
import { type NetworkFeature, type NetworkType, getNetworkType } from '@suite-common/wallet-config';
import {
    type Account,
    type AccountKey,
    type ChainedTransactions,
    type GeneralPrecomposedTransactionFinal,
    type PrecomposedTransactionFinal,
    type PrecomposedTransactionFinalBumpFeeRbf,
    type PrecomposedTransactionFinalCancelRbf,
    type RatesByTimestamps,
    type RbfTransactionParamsBitcoin,
    type RbfTransactionParamsEthereum,
    type Timestamp,
    type TokenAddress,
    type WalletAccountTransaction,
    asBaseCurrencyAmount,
} from '@suite-common/wallet-types';
import type { BaseCurrencyCode, TokenStandard } from '@trezor/blockchain-link-types';
import {
    type AccountAddress,
    type AccountTransaction,
    type InternalTransfer,
    type TokenInfo,
    type TokenTransfer,
} from '@trezor/connect';
import { type Branded } from '@trezor/type-utils';
import { BigNumber, arrayPartition, isNotNullOrUndefined, typedObjectKeys } from '@trezor/utils';

import { convertAmountSubunitsToUnits, formatNetworkAmount } from './amountUtils';
import { isCardanoStakingTx } from './cardanoStakingUtils';
import { fromGwei, fromWei } from './ethConverter';
import { getEvmTransactionTextSignature } from './ethUtils';
import { isStakeTypeTx } from './ethereumStakingUtils';
import { toFiatCurrency } from './fiatConverterUtils';
import { getFiatRateKey, roundTimestampToNearestPastHour } from './fiatRatesUtils';
import { getMyInputsFromTransaction } from './getMyInputsFromTransaction';
import { isTronStakingTx } from './tronStakingUtils';

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
    accountKey: AccountKey,
    transactions: Record<AccountKey, WalletAccountTransaction[]>,
) => transactions[accountKey] || [];

export const isPending = (tx: WalletAccountTransaction | AccountTransaction) => {
    if (tx && tx.solanaSpecific?.status === 'confirmed') {
        return false;
    }

    return !!tx && (!tx.blockHeight || tx.blockHeight < 0);
};

// Also matches 'contract': a contract-deployment tx is signed and broadcast from the account's own
// address and consumes an EVM nonce exactly like a plain send, so it must count toward the same
// nonce pool (see getEvmNonceInfo) even though blockbook classifies it under a distinct type.
export const isSentTransaction = (tx: WalletAccountTransaction | AccountTransaction) =>
    ['sent', 'self', 'contract'].includes(tx.type);

// Shared by the transaction list and its detail modal so both agree on which pending
// transactions offer a cancel/bump-fee action.
export const isTransactionCancellable = (
    tx: WalletAccountTransaction | AccountTransaction,
    isPendingTx: boolean,
    networkType: NetworkType,
) =>
    isPendingTx &&
    tx.type !== 'self' &&
    tx.type !== 'joint' &&
    (networkType === 'bitcoin' || networkType === 'ethereum');

export const isTransactionBumpable = (
    tx: Pick<WalletAccountTransaction, 'rbfParams' | 'deadline' | 'type'>,
    networkFeatures: NetworkFeature[] | undefined,
) => !!tx.rbfParams && !!networkFeatures?.includes('rbf') && !tx.deadline && tx.type !== 'joint';

export type EvmNonceInfo = { confirmedNonce: number; nextNonce: number; pendingNonces: number[] };

const getOwnEvmNonceSets = (transactions: WalletAccountTransaction[]) => {
    const ownNonceTxs = transactions.filter(isSentTransaction);

    // A nonce that's confirmed locally is ground truth. If a stale "pending" record for the same
    // nonce also lingers (e.g. a speed-up/cancel replacement got confirmed but the original's
    // local record was never swept — see replaceTransactionThunk), drop the pending duplicate so
    // it can't inflate nextNonce past where it actually is.
    const confirmedNonces = new Set(
        ownNonceTxs
            .filter(tx => !isPending(tx))
            .map(tx => tx.ethereumSpecific?.nonce)
            .filter((nonce): nonce is number => typeof nonce === 'number'),
    );

    const pendingNonceSet = new Set(
        ownNonceTxs
            .filter(isPending)
            .map(tx => tx.ethereumSpecific?.nonce)
            .filter((nonce): nonce is number => typeof nonce === 'number')
            .filter(nonce => !confirmedNonces.has(nonce)),
    );

    return { confirmedNonces, pendingNonceSet };
};

/**
 * Returns the next EVM nonce to use, walking past any contiguous outgoing pending txs starting
 * from `accountNonce`. Stops at the first gap so a stuck/gapped tx does not inflate the result.
 * Takes the account's full (unfiltered) local tx list — it needs both pending and confirmed
 * entries to spot a pending tx whose nonce was already confirmed under a different txid.
 *
 * `accountNonce` here is treated as *untrusted* (e.g. `account.misc.nonce`, which can be
 * stale/pending-inclusive — trezor/blockbook#1562) and is reconciled against local tx data. When
 * a properly mined-only nonce is already available (fetched live via
 * `TrezorConnect.getAccountInfo({ confirmedNonce: true })`), use `getEvmNonceInfoFromConfirmedNonce`
 * instead — running an already-trustworthy value through this reconciliation is not just
 * redundant, it's actively harmful: a single bad locally-known nonce (e.g. corrupted/malformed tx
 * data) can override an otherwise-correct backend answer.
 */
export const getEvmNonceInfo = (
    accountNonce: number,
    transactions: WalletAccountTransaction[],
): EvmNonceInfo => {
    const { confirmedNonces, pendingNonceSet } = getOwnEvmNonceSets(transactions);

    // accountNonce (e.g. account.misc.nonce) can lag behind the local tx list if it hasn't been
    // refreshed since a confirmed tx was locally picked up. A locally confirmed nonce proves a
    // higher true nonce exists, so it's a floor accountNonce can't be below. When no confirmed
    // nonce is locally known this is 0, so it never lowers accountNonce.
    const maxLocalConfirmedNonce = confirmedNonces.size > 0 ? Math.max(...confirmedNonces) + 1 : 0;
    const effectiveAccountNonce = Math.max(accountNonce, maxLocalConfirmedNonce);

    // effectiveAccountNonce may still overstate reality via blockbook's pending nonce
    // (eth_getTransactionCount("pending")), which already advances past consecutive mempool txs —
    // including ones Suite doesn't know about (sent from another wallet). A locally-known pending
    // tx at nonce N proves the chain hasn't confirmed N yet, so the true confirmed nonce can't
    // exceed the lowest pending nonce we see.
    const lowestPendingNonce =
        pendingNonceSet.size > 0 ? Math.min(...pendingNonceSet) : effectiveAccountNonce;
    const confirmedNonce = Math.min(effectiveAccountNonce, lowestPendingNonce);

    let nextNonce = confirmedNonce;
    while (pendingNonceSet.has(nextNonce)) nextNonce += 1;

    return { confirmedNonce, nextNonce, pendingNonces: [...pendingNonceSet] };
};

/**
 * Same shape as `getEvmNonceInfo`, but for a `confirmedNonce` that's already trustworthy (fetched
 * live from the backend). Skips `getEvmNonceInfo`'s local-data reconciliation entirely — that
 * logic exists only to compensate for an unreliable `account.misc.nonce`, and applying it here
 * would let a single bad locally-known nonce override a correct backend answer. The only local
 * adjustment still needed is walking forward past the account's own contiguous pending txs, since
 * those are what a new send must avoid colliding with.
 */
export const getEvmNonceInfoFromConfirmedNonce = (
    confirmedNonce: number,
    transactions: WalletAccountTransaction[],
): EvmNonceInfo => {
    const { pendingNonceSet } = getOwnEvmNonceSets(transactions);

    let nextNonce = confirmedNonce;
    while (pendingNonceSet.has(nextNonce)) nextNonce += 1;

    return { confirmedNonce, nextNonce, pendingNonces: [...pendingNonceSet] };
};

export type PendingEvmNonceStatus = 'ok' | 'superseded' | 'gap';

/**
 * Whether an already-pending transaction's own nonce is stuck, given the account's bounds from
 * `getEvmNonceInfo`. Used by the transaction list and its detail modal to grey out/warn about a
 * pending tx that can never confirm. Deliberately ignores `pendingNonces` — a pending tx's own
 * nonce is trivially a member of that set, which would otherwise always read as a "replacement".
 */
export const getPendingEvmNonceStatus = (
    nonce: number,
    { confirmedNonce, nextNonce }: Pick<EvmNonceInfo, 'confirmedNonce' | 'nextNonce'>,
): PendingEvmNonceStatus => {
    if (nonce < confirmedNonce) return 'superseded'; // already mined under another tx/txid
    if (nonce > nextNonce) return 'gap'; // a lower nonce is still missing

    return 'ok';
};

/**
 * Classifies a *candidate* EVM nonce (e.g. typed into the send-form override) against the bounds
 * from `getEvmNonceInfo`. Unlike `getPendingEvmNonceStatus`, landing anywhere below `nextNonce` —
 * whether or not it matches a nonce Suite has a local record for — means the candidate would
 * replace one of the account's own currently-queued pending txs, which needs a fee bump to be
 * accepted; only landing exactly on `nextNonce` extends the queue normally. A match against
 * `pendingNonces` is checked first and takes priority over a gap: a candidate can simultaneously
 * sit above `nextNonce` (a gap exists below it) and match an existing own pending tx, and
 * replacement is the actionable case (offer a fee bump) rather than a dead end.
 */
export const getEvmNonceStatus = (
    nonce: number,
    { confirmedNonce, nextNonce, pendingNonces }: EvmNonceInfo,
): 'ok' | 'superseded' | 'gap' | 'replacement' => {
    if (nonce < confirmedNonce) return 'superseded'; // already mined under another tx/txid
    if (pendingNonces.includes(nonce)) return 'replacement'; // collides with a known own pending tx
    if (nonce > nextNonce) return 'gap'; // a lower nonce is still missing
    if (nonce < nextNonce) return 'replacement'; // within the contiguous pending range

    return 'ok'; // nonce === nextNonce, extends the queue normally
};

export const isRbfTransaction = (
    tx: GeneralPrecomposedTransactionFinal,
): tx is PrecomposedTransactionFinalBumpFeeRbf | PrecomposedTransactionFinalCancelRbf =>
    'rbfType' in tx;

export const isRbfBumpFeeTransaction = (
    tx: GeneralPrecomposedTransactionFinal,
): tx is PrecomposedTransactionFinalBumpFeeRbf => isRbfTransaction(tx) && tx.rbfType === 'bump-fee';

export const isRbfCancelTransaction = (
    tx: GeneralPrecomposedTransactionFinal,
): tx is PrecomposedTransactionFinalCancelRbf => isRbfTransaction(tx) && tx.rbfType === 'cancel';

/* Convert date to string in YYYY-MM-DD format */
const generateTransactionDateKey = (d: Date) =>
    `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

/** Parse Date object from a string in YYYY-MM-DD format */
export const parseTransactionDateKey = (key: string) => {
    const [year, month, day] = key.split('-');

    return new Date(Number(year), Number(month) - 1, Number(day));
};

export type MonthKey = string & Branded<'MonthKey'>;
export const generateTransactionMonthKey = (d: Date): MonthKey =>
    // Adding days because of time zones of UTC
    addDays(startOfMonth(d), 1).toUTCString() as MonthKey;

export const parseTransactionMonthKey = (key: MonthKey): Date => new Date(key);

export type GroupedTransactionsByDate = Record<string, WalletAccountTransaction[]>;
/**
 * Returns object with transactions grouped by a date. Key is a string in YYYY-MM-DD format.
 *
 * @param {WalletAccountTransaction[]} transactions
 */
export const groupTransactionsByDate = (
    transactions: WalletAccountTransaction[],
    groupBy: 'day' | 'month' = 'day',
): GroupedTransactionsByDate => {
    // Note: We should use ts-belt for sorting this array but currently, there can be undefined inside
    // Built-in sort doesn't include undefined elements but ts-belt does so there will be some refactoring involved.
    const keyFormatter =
        groupBy === 'day' ? generateTransactionDateKey : generateTransactionMonthKey;

    return (
        [...transactions]
            // There could be some undefined/null in array, not sure how it happens. Maybe related to pagination?
            .filter(transaction => !!transaction)
            .sort(sortByBlockHeight)
            .reduce<GroupedTransactionsByDate>((r, item) => {
                // pending txs are grouped as 'no-blocktime' only if blockTime is unavailable (otherwise sorted by blockTime)
                const key =
                    item.blockTime && item.blockTime > 0
                        ? keyFormatter(new Date(item.blockTime * 1000))
                        : 'no-blocktime';
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

            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const lastFirst: (typeof last)[number] = last[0];

            return tx.type === 'joint' && lastFirst.type === 'joint'
                ? [...prev, [...last, tx]]
                : [...prev, last, [tx]];
        }, [])
        .map(txs => {
            if (txs.length > 1) {
                return { type: 'joint-batch', rounds: txs } as const;
            }
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const onlyTx: (typeof txs)[number] = txs[0];

            return { type: 'single-tx', tx: onlyTx } as const;
        });

export const formatCardanoWithdrawal = (tx: WalletAccountTransaction) =>
    tx.cardanoSpecific?.withdrawal
        ? formatNetworkAmount(tx.cardanoSpecific.withdrawal, tx.symbol)
        : undefined;

export const formatCardanoDeposit = (tx: WalletAccountTransaction) =>
    tx.cardanoSpecific?.deposit
        ? formatNetworkAmount(tx.cardanoSpecific.deposit, tx.symbol)
        : undefined;

export const getCardanoStakingSignValue = (transaction: WalletAccountTransaction) => {
    if (!transaction?.cardanoSpecific) return 'negative';
    const subtype = transaction.cardanoSpecific?.subtype;

    switch (subtype) {
        case 'stake_registration':
            return 'negative';
        case 'stake_deregistration':
        case 'withdrawal':
            return 'positive';
    }

    return 'positive';
};

export const isTxFeePaid = (tx: WalletAccountTransaction) => {
    const showFeeRowForSolClaim = tx?.solanaSpecific?.stakeOperation?.type === 'claim';
    const showFeeRowForStellar = tx?.stellarSpecific?.feeSource === tx.descriptor;
    const isCardano = !!tx?.cardanoSpecific;
    const showFeeRowForCardano = isCardano && tx.type !== 'recv';

    return (
        (!!tx.details.vin.find(vin => vin.isOwn || vin.isAccountOwned) && tx.type !== 'joint') ||
        showFeeRowForSolClaim ||
        showFeeRowForStellar ||
        showFeeRowForCardano
    );
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
        const amount = formatNetworkAmount(tx.amount, tx.symbol);
        const fee = formatNetworkAmount(tx.fee, tx.symbol);

        if (tx.type === 'self') {
            const cardanoWithdrawal = formatCardanoWithdrawal(tx);
            if (cardanoWithdrawal) {
                totalAmount = totalAmount.plus(cardanoWithdrawal);
            }

            const cardanoDeposit = formatCardanoDeposit(tx);
            if (cardanoDeposit) {
                totalAmount = totalAmount.minus(cardanoDeposit);
            }
        }

        // count in only if Inputs/Outputs includes my account (EVM does not need to)
        if (tx.type === 'sent') {
            totalAmount = totalAmount.minus(amount);
        }

        if (tx.type === 'recv' || tx.type === 'joint') {
            totalAmount = totalAmount.plus(amount);
        }

        if (isTxFeePaid(tx)) {
            totalAmount = totalAmount.minus(fee);
        }

        tx.internalTransfers.forEach(internalTx => {
            const amountInternal = formatNetworkAmount(internalTx.amount, tx.symbol);

            if (internalTx.type === 'sent') {
                totalAmount = totalAmount.minus(amountInternal);
            }
            if (internalTx.type === 'recv') {
                totalAmount = totalAmount.plus(amountInternal);
            }
        });
    });

    return totalAmount;
};

export const sumTransactionsFiat = (
    transactions: WalletAccountTransaction[],
    fiatCurrency: BaseCurrencyCode,
    historicFiatRates: RatesByTimestamps | undefined,
) => {
    let totalAmount = new BigNumber(0);
    transactions.forEach(tx => {
        const amount = formatNetworkAmount(tx.amount, tx.symbol);
        const fee = formatNetworkAmount(tx.fee, tx.symbol);

        const fiatRateKey = getFiatRateKey(tx.symbol, fiatCurrency);
        const roundedTimestamp = roundTimestampToNearestPastHour(tx.blockTime as Timestamp);
        const historicRate = historicFiatRates?.[fiatRateKey]?.[roundedTimestamp];

        if (tx.type === 'self') {
            const cardanoWithdrawal = formatCardanoWithdrawal(tx);
            if (cardanoWithdrawal) {
                totalAmount = totalAmount.plus(
                    toFiatCurrency({ amount: cardanoWithdrawal, rate: historicRate }) ?? 0,
                );
            }

            const cardanoDeposit = formatCardanoDeposit(tx);
            if (cardanoDeposit) {
                totalAmount = totalAmount.minus(
                    toFiatCurrency({ amount: cardanoDeposit, rate: historicRate }) ?? 0,
                );
            }
        }

        if (tx.tokens.length > 0) {
            tx.tokens.forEach(token => {
                const transferType = token.type;

                const tokenFiatRateKey = getFiatRateKey(
                    tx.symbol,
                    fiatCurrency,
                    token.contract as TokenAddress,
                );
                const historicTokenRate = historicFiatRates?.[tokenFiatRateKey]?.[roundedTimestamp];
                const tokenAmount = convertAmountSubunitsToUnits(token.amount, token.decimals);

                if (transferType === 'sent') {
                    totalAmount = totalAmount.minus(
                        toFiatCurrency({ amount: tokenAmount, rate: historicTokenRate }) ?? 0,
                    );
                }

                if (transferType === 'recv') {
                    totalAmount = totalAmount.plus(
                        toFiatCurrency({ amount: tokenAmount, rate: historicTokenRate }) ?? 0,
                    );
                }
            });
        } else {
            // count in only if Inputs/Outputs includes my account (EVM does not need to)
            if (tx.type === 'sent') {
                totalAmount = totalAmount.minus(
                    toFiatCurrency({ amount, rate: historicRate }) ?? 0,
                );
            }

            if (tx.type === 'recv' || tx.type === 'joint') {
                totalAmount = totalAmount.plus(toFiatCurrency({ amount, rate: historicRate }) ?? 0);
            }
        }

        if (isTxFeePaid(tx)) {
            totalAmount = totalAmount.minus(
                toFiatCurrency({ amount: fee, rate: historicRate }) ?? 0,
            );
        }

        tx.internalTransfers.forEach(internalTx => {
            const amountInternal = formatNetworkAmount(internalTx.amount, tx.symbol);
            const amountInternalFiat =
                toFiatCurrency({ amount: amountInternal, rate: historicRate }) ?? 0;

            if (internalTx.type === 'sent') {
                totalAmount = totalAmount.minus(amountInternalFiat);
            }
            if (internalTx.type === 'recv') {
                totalAmount = totalAmount.plus(amountInternalFiat);
            }
        });
    });

    return asBaseCurrencyAmount(totalAmount);
};

export const findTransaction = (txid: string, transactions: WalletAccountTransaction[]) =>
    transactions.find(t => t?.txid === txid);

export const findTransactions = (
    txid: string,
    transactions: { [key: AccountKey]: WalletAccountTransaction[] },
) =>
    typedObjectKeys(transactions).flatMap(key => {
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const txList: WalletAccountTransaction[] = transactions[key];
        const tx = findTransaction(txid, txList);
        if (!tx) return [];

        return [{ key, tx }];
    });

// Find chained pending transactions
export const findChainedTransactions = (
    descriptor: string,
    txid: string,
    transactions: Record<AccountKey, WalletAccountTransaction[]>,
    result: ChainedTransactions = { own: [], others: [] },
) => {
    typedObjectKeys(transactions).forEach(accountKey => {
        const ownTxs = result.own.map(tx => tx.txid);
        const othersTxs = result.others.map(tx => tx.txid);
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const accountTxs: WalletAccountTransaction[] = transactions[accountKey];
        // check if any pending transaction is using the utxo/vin with requested txid
        const txs = accountTxs.filter(tx => {
            if (!isPending(tx) || !tx.details.vin.find(i => i.txid === txid)) {
                return false;
            }

            if (tx.descriptor === descriptor && !ownTxs.includes(tx.txid)) {
                if (othersTxs.includes(tx.txid)) {
                    result.others = result.others.filter(t => t.txid !== tx.txid);
                }
                result.own.push(tx);

                return true;
            }

            if (!ownTxs.includes(tx.txid) && !othersTxs.includes(tx.txid)) {
                result.others.push(tx);

                return true;
            }

            return false;
        });

        // each affected tx.vout can be used in another tx.vin
        // find recursively
        txs.forEach(tx => {
            findChainedTransactions(descriptor, tx.txid, transactions, result);
        });
    });

    return result.own.concat(result.others).length > 0 ? result : undefined;
};

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
        add: result.add.filter(a => !preserve.some(tx => tx.txid === a.txid)),
        remove: result.remove.filter(a => !preserve.some(tx => tx.txid === a.txid)),
    };
};

export const analyzeTransactions = (
    fresh: AccountTransaction[],
    known: WalletAccountTransaction[],
    context: { blockHeight: number },
) => {
    const { blockHeight } = context;
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

    const [knownPrepending, knownRest] = arrayPartition(known, tx => 'deadline' in tx);

    const removePrepending = knownPrepending.filter(
        tx => (tx.deadline && tx.deadline < blockHeight) || fresh.find(fTx => fTx.txid === tx.txid),
    );
    // If there are no known confirmed txs
    // remove all known and add all fresh
    const gotConfirmedTxs = knownRest.some(tx => !isPending(tx));
    if (!gotConfirmedTxs) {
        return filterAnalyzeResult({
            newTransactions: fresh.filter(tx => !isPending(tx)),
            add: fresh,
            remove: [...knownRest, ...removePrepending],
        });
    }

    // make sure the known transactions are sorted properly
    const knownSorted = knownRest.filter(isNotNullOrUndefined).sort(sortByBlockHeight);
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
                // @ts-expect-error: indexing with noUncheckedIndexedAccess
                const kTx: (typeof knownSorted)[number] = knownSorted[index];
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
        remove: [...knownSorted.slice(0, sliceIndex), ...removePrepending],
    });
};

export const getTxOperation = (
    type: WalletAccountTransaction['type'] | TokenTransfer['type'] | InternalTransfer['type'],
    ignoreSelf = false,
): SignOperator | null => {
    if (type === 'sent' || (!ignoreSelf && type === 'self')) {
        return 'negative';
    }
    if (type === 'recv') {
        return 'positive';
    }

    return null;
};

export const NFT_SINGLETOKEN_STANDARDS: ReadonlySet<TokenStandard> = new Set([
    'ERC721',
    'TRC721',
    'BEP721',
]);

export const NFT_MULTITOKEN_STANDARDS: ReadonlySet<TokenStandard> = new Set([
    'ERC1155',
    'TRC1155',
    'BEP1155',
]);

const NFT_TOKEN_STANDARDS: ReadonlySet<TokenStandard> = new Set([
    ...NFT_SINGLETOKEN_STANDARDS,
    ...NFT_MULTITOKEN_STANDARDS,
]);

export const isNftToken = <T extends Pick<TokenInfo, 'standard'>>(token: T) =>
    NFT_TOKEN_STANDARDS.has(token.standard);

export const isNftTokenTransfer = <T extends Pick<TokenTransfer, 'standard'>>(transfer: T) =>
    transfer.standard && NFT_TOKEN_STANDARDS.has(transfer.standard);

export const isNftMultitokenTransfer = (transfer: TokenTransfer) =>
    !!transfer.multiTokenValues && transfer.multiTokenValues.length > 0;

export const getNftTokenId = (transfer: TokenTransfer) => {
    if (
        !transfer.standard ||
        !NFT_MULTITOKEN_STANDARDS.has(transfer.standard) ||
        !transfer.multiTokenValues?.length
    ) {
        return transfer.amount;
    }

    const { multiTokenValues } = transfer;
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const firstValue: (typeof multiTokenValues)[number] = multiTokenValues[0];

    // use 0 index, haven't found an example where multiTokenValues.length > 1
    return firstValue.id;
};

export const isSwapTransaction = (transaction: WalletAccountTransaction) => {
    const { tokens, internalTransfers, targets, cardanoSpecific } = transaction;

    // Swap transaction - 2 tokens, token to native or native to token
    if (
        tokens.length === 2 ||
        (tokens.length === 1 && (internalTransfers.length === 1 || targets.length === 1))
    ) {
        const hasSent =
            tokens.some(t => t.type === 'sent') ||
            internalTransfers.some(t => t.type === 'sent') ||
            targets.length > 0;

        const hasRecv =
            tokens.some(t => t.type === 'recv') || internalTransfers.some(t => t.type === 'recv');

        return hasSent && hasRecv && !cardanoSpecific;
    }

    return false;
};

export const isStakingTransaction = (transaction: WalletAccountTransaction) => {
    // Cardano staking transactions
    if (isCardanoStakingTx(transaction)) {
        return true;
    }

    // Solana staking transactions
    if (transaction.solanaSpecific?.stakeOperation?.type) {
        return true;
    }

    // Ethereum staking transactions
    if (isStakeTypeTx(transaction.ethereumSpecific?.parsedData?.methodId)) {
        return true;
    }

    if (isTronStakingTx(transaction)) {
        return true;
    }

    return false;
};

export const getTargetAmountRaw = (
    target: WalletAccountTransaction['targets'][number] | undefined,
    transaction: WalletAccountTransaction,
) => {
    const txAmount = new BigNumber(transaction.amount ?? '0');
    const validTxAmount = txAmount?.gt(0);
    if (!target) {
        return validTxAmount ? txAmount : null;
    }

    const sentToSelfTarget =
        (transaction.type === 'sent' || transaction.type === 'self') && target.isAccountTarget;

    const amount = target.amount && new BigNumber(target.amount);
    const validTargetAmount = amount && amount.gt(0);
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

export const getTargetAmount = (
    target: WalletAccountTransaction['targets'][number] | undefined,
    transaction: WalletAccountTransaction,
) => {
    const value = getTargetAmountRaw(target, transaction);

    return value ? formatNetworkAmount(value.toString(), transaction.symbol) : null;
};

export const getFeeRate = (tx: AccountTransaction) =>
    // calculate fee rate, TODO: add this to blockchain-link tx details
    new BigNumber(tx.fee).div(tx.details.size).integerValue(BigNumber.ROUND_CEIL).toString();

// used by replaceTransactionThunk
export const replaceEthereumSpecific = (
    tx: AccountTransaction,
    precomposedTx: PrecomposedTransactionFinal,
) => {
    if (!tx.ethereumSpecific) return;

    return {
        ...tx.ethereumSpecific,
        gasLimit: Number(precomposedTx.feeLimit),
        gasPrice: fromGwei(precomposedTx.feePerByte).toWei(),
    };
};

const getEthereumRbfParams = (
    tx: AccountTransaction,
    account: Account,
): RbfTransactionParamsEthereum | undefined => {
    if (
        account.networkType !== 'ethereum' ||
        tx.type === 'recv' ||
        !tx.ethereumSpecific ||
        !isPending(tx) ||
        !tx.rbf
    ) {
        return; // ignore non rbf and mined transactions
    }

    const { vout } = tx.details;

    const { data, nonce, gasPrice, maxFeePerGas, maxPriorityFeePerGas } = tx.ethereumSpecific;

    // ignore empty calldata represented as '0x'
    const transactionData = !data || data === '0x' ? '' : data;

    const txSignature = getEvmTransactionTextSignature(transactionData);

    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const firstVout: (typeof vout)[number] = vout[0];
    const firstVoutAddresses = firstVout.addresses!;
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const toAddress: string = firstVoutAddresses[0];

    let output;
    switch (txSignature) {
        case 'transfer': {
            const { tokens } = tx;
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const token: (typeof tokens)[number] = tokens[0];

            output = {
                address: token.to,
                token: token.contract,
                amount: token.amount,
                formattedAmount: convertAmountSubunitsToUnits(token.amount, token.decimals),
            };
            break;
        }
        case 'approve':
        case 'revoke': {
            const approvalData = Calldata.evm.erc20.approve.decode(data);
            const amount = approvalData?.amount.toString() ?? '0';

            const token = account.tokens?.find(t => t.contract === toAddress);

            output = {
                address: toAddress,
                token: toAddress, // approval is send to token address
                amount,
                formattedAmount: convertAmountSubunitsToUnits(amount, token?.decimals || 0),
            };
            break;
        }
        default: {
            // Token-moving contract calls report value=0 in vout; pull the amount from tokens[0].
            const tokenTransfer = tx.tokens?.[0];
            if (tokenTransfer) {
                output = {
                    address: toAddress,
                    token: tokenTransfer.contract,
                    amount: tokenTransfer.amount,
                    formattedAmount: convertAmountSubunitsToUnits(
                        tokenTransfer.amount,
                        tokenTransfer.decimals,
                    ),
                };
            } else {
                output = {
                    address: toAddress,
                    amount: vout[0]!.value!,
                    formattedAmount: formatNetworkAmount(vout[0]!.value!, account.symbol),
                };
            }
        }
    }

    return {
        type: 'ethereum',
        txid: tx.txid,
        outputs: [
            {
                type: 'payment',
                ...output,
            },
        ],
        ethereumNonce: nonce,
        transactionData: txSignature === 'transfer' ? '' : transactionData,
        gasPrice: gasPrice ? fromWei(gasPrice).toGwei() : '',
        maxFeePerGas: maxFeePerGas ? fromWei(maxFeePerGas).toGwei() : '',
        maxPriorityFeePerGas: maxPriorityFeePerGas ? fromWei(maxPriorityFeePerGas).toGwei() : '',
    };
};

const getBitcoinRbfParams = (
    tx: AccountTransaction,
    account: Account,
): RbfTransactionParamsBitcoin | undefined => {
    if (account.networkType !== 'bitcoin') return;
    if (tx.type === 'recv' || !tx.details || !isPending(tx)) return; // ignore mined transactions
    const { vout } = tx.details;

    const changeAddresses = account.addresses ? account.addresses.change : [];

    const utxo = getMyInputsFromTransaction({ tx, account });

    // find change address and output
    let changeAddress: AccountAddress | undefined;
    const outputs: RbfTransactionParamsBitcoin['outputs'] = [];
    vout.forEach(output => {
        const outputAddresses = output.addresses!;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const firstAddress: string = outputAddresses[0];
        if (!output.isAddress) {
            // TODO: this should be done in @trezor/connect, blockchain-link or even blockbook
            // blockbook sends output.hex as scriptPubKey with additional prefix where: 6a - OP_RETURN and XX - data len. this field should be parsed by @trezor/utxo-lib
            // blockbook sends ascii data in output.address[0] field in format: "OP_RETURN (ASCII-VALUE)". as a workaround we are extracting ascii data from here
            const dataAscii = firstAddress.match(/^OP_RETURN \((.*)\)/)?.pop(); // strip ASCII data from brackets
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
                address: firstAddress,
                amount: output.value!,
                formattedAmount: formatNetworkAmount(output.value!, account.symbol),
            });
            if (changeOutput) {
                changeAddress = changeOutput;
            }
        }
    });

    if (!utxo.length || !outputs.length || outputs.length !== vout.length) return;

    return {
        type: 'bitcoin',
        txid: tx.txid,
        utxo,
        outputs,
        changeAddress,
        // fee rate is calculated in blockchain-link but only for newer versions of blockbook. users
        // that have old transactions saved in their database might not have this data so legacy way
        // of displaying fee rate is kept here
        feeRate: tx.feeRate || getFeeRate(tx),
        baseFee: parseInt(tx.fee, 10),
        locktime: tx.lockTime,
    };
};

export const getRbfParams = (
    tx: AccountTransaction,
    account: Account,
): WalletAccountTransaction['rbfParams'] => {
    switch (account.networkType) {
        case 'bitcoin':
            return getBitcoinRbfParams(tx, account);
        case 'ethereum':
            return getEthereumRbfParams(tx, account);
        default:
            return undefined;
    }
};

const enhanceTokenTransfers = (
    tokenTransfers: AccountTransaction['tokens'],
    accountSymbol: Account['symbol'],
) => {
    if (!tokenTransfers || tokenTransfers.length === 0) {
        return tokenTransfers;
    }

    const isEvmNetwork = getNetworkType(accountSymbol) === 'ethereum';

    return tokenTransfers.map(transfer => {
        if (!transfer.symbol) {
            return transfer;
        }

        return {
            ...transfer,
            symbol: isEvmNetwork ? transfer.symbol : transfer.symbol.toUpperCase(),
        };
    });
};

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
): WalletAccountTransaction => ({
    descriptor: account.descriptor,
    deviceState: account.deviceState,
    symbol: account.symbol,
    ...origTx,
    tokens: enhanceTokenTransfers(origTx.tokens, account.symbol),
    rbfParams: getRbfParams(origTx, account),
    hex: (origTx.blockHeight ?? 0) <= 0 && origTx.rbf ? origTx.hex : undefined, // store tx hex **only** for pending transactions (used by rbf)
});

export const getTxHeaderSymbol = (transaction: WalletAccountTransaction) => {
    const { tokens } = transaction;
    const isSingleTokenTransaction = tokens.length === 1;

    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const firstToken: (typeof tokens)[number] = tokens[0];
    // if there's exactly one token, use its symbol; otherwise, use the main network symbol
    const symbol = isSingleTokenTransaction ? firstToken.symbol : transaction.symbol;

    return symbol;
};

export const groupTokensTransactionsByContractAddress = (
    txs: WalletAccountTransaction[],
): Record<TokenAddress, WalletAccountTransaction[]> => {
    const groupedTokensTxs: Record<TokenAddress, WalletAccountTransaction[]> = {};

    txs.forEach(tx => {
        if (tx.tokens && tx.tokens.length > 0) {
            tx.tokens.forEach(token => {
                const groupKey = token.contract as TokenAddress;
                if (!groupedTokensTxs[groupKey]) {
                    groupedTokensTxs[groupKey] = [];
                }
                groupedTokensTxs[groupKey].push(tx);
            });
        }
    });

    return groupedTokensTxs;
};

export const getTransactionWithLowestNonce = (
    transactionGroups: GroupedTransactionsByDate,
): WalletAccountTransaction | null => {
    const txs = Object.values(transactionGroups)
        .flat()
        .filter(tx => tx.ethereumSpecific && isSentTransaction(tx));

    if (txs.length === 0) return null;

    return txs.reduce((lowestNonceTransaction, tx) =>
        Number(tx.ethereumSpecific!.nonce) < Number(lowestNonceTransaction.ethereumSpecific!.nonce)
            ? tx
            : lowestNonceTransaction,
    );
};

export const getTxValidityTimeoutInMs = (networkType?: NetworkType) => {
    if (networkType === 'solana') {
        // Blockhash required in Solana tx is valid for 1 minute. Leave 15 seconds for tx confirmation.
        return 45 * 1000;
    }

    return 0;
};
