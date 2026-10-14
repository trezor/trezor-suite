import type { TokenInfo, TokenTransfer, Transaction } from '@trezor/blockchain-link-types';
import * as utils from '@trezor/blockchain-link-utils/src/stellar';
import type { StellarContractTokenTransfer } from '@trezor/network-stellar/types';

/** Where a page stopped reading the tokens' events, alongside Horizon's own paging token. */
interface ReceiptPosition {
    /** The oldest ledger the page reached. */
    ledger: number;
    /** The transfers of that ledger already listed; the rest of it is still to come. */
    txHashes: string[];
}

export interface StellarPageCursor {
    horizon?: string;
    receipts?: ReceiptPosition;
}

const RECEIPTS_SEPARATOR = '|';
const LEDGER_SEPARATOR = ':';
const HASH_SEPARATOR = ',';

/** Opaque to everything but this worker, which reads history from two sources at once. */
export const parseStellarPageCursor = (cursor?: string): StellarPageCursor => {
    const [horizon, receipts] = (cursor ?? '').split(RECEIPTS_SEPARATOR);
    const [ledger, hashes] = (receipts ?? '').split(LEDGER_SEPARATOR);
    const ledgerSequence = Number(ledger);

    return {
        horizon: horizon || undefined,
        receipts:
            ledger && Number.isFinite(ledgerSequence)
                ? {
                      ledger: ledgerSequence,
                      txHashes: (hashes ?? '').split(HASH_SEPARATOR).filter(Boolean),
                  }
                : undefined,
    };
};

export const formatStellarPageCursor = ({ horizon, receipts }: StellarPageCursor) =>
    receipts
        ? [
              horizon ?? '',
              `${receipts.ledger}${LEDGER_SEPARATOR}${receipts.txHashes.join(HASH_SEPARATOR)}`,
          ].join(RECEIPTS_SEPARATOR)
        : horizon;

interface ContractTokenReceipt {
    txHash: string;
    ledger: number;
    closedAt: number;
    transfers: StellarContractTokenTransfer[];
}

/** One record per transaction: a single call can move a token more than once, or move several. */
const groupByTransaction = (
    transfers: readonly StellarContractTokenTransfer[],
): ContractTokenReceipt[] => {
    const byTransaction = new Map<string, ContractTokenReceipt>();

    transfers.forEach(transfer => {
        const { txHash, ledger, closedAt } = transfer;
        const receipt = byTransaction.get(txHash);

        if (receipt) {
            receipt.transfers.push(transfer);
        } else {
            byTransaction.set(txHash, { txHash, ledger, closedAt, transfers: [transfer] });
        }
    });

    // The transfers arrive newest first, and a map keeps the order they were added in.
    return [...byTransaction.values()];
};

/** Everything the last page did not reach: older ledgers, and the rest of the one it stopped in. */
const isPending = ({ txHash, ledger }: ContractTokenReceipt, position?: ReceiptPosition) =>
    !position ||
    ledger < position.ledger ||
    (ledger === position.ledger && !position.txHashes.includes(txHash));

export interface MergeContractTokenReceiptsParams {
    descriptor: string;
    horizonTransactions: Transaction[];
    transfers: readonly StellarContractTokenTransfer[];
    tokenByContract: Map<string, TokenInfo>;
    pageSize: number;
    /** Horizon holds nothing older than this page, so every remaining event belongs on it. */
    isLastHorizonPage: boolean;
    position?: ReceiptPosition;
}

/**
 * Builds one page of history out of both sources. A transfer Horizon already lists is folded into
 * that record, which would otherwise report a call that moved nothing; the rest become records of
 * their own. Suite reads a page top-down and stops paging at a short one, so the page is filled to
 * `pageSize` and whatever it pushed out is left to the cursor.
 */
export const mergeContractTokenReceipts = ({
    descriptor,
    horizonTransactions,
    transfers,
    tokenByContract,
    pageSize,
    isLastHorizonPage,
    position,
}: MergeContractTokenReceiptsParams) => {
    const toTokenTransfers = (receipt: ContractTokenReceipt): TokenTransfer[] =>
        receipt.transfers.flatMap(transfer => {
            const token = tokenByContract.get(transfer.contract);

            return token ? [utils.transformContractTokenTransfer(transfer, token, descriptor)] : [];
        });

    // Anything older would sort below rows Horizon still has to hand over on the next page.
    const oldestHorizonLedger =
        horizonTransactions[horizonTransactions.length - 1]?.blockHeight ?? 0;

    const pending = groupByTransaction(transfers)
        .filter(
            receipt =>
                isPending(receipt, position) &&
                (isLastHorizonPage || receipt.ledger >= oldestHorizonLedger),
        )
        .map(receipt => ({ ...receipt, tokens: toTokenTransfers(receipt) }))
        .filter(({ tokens }) => tokens.length > 0);

    const listed = new Set(horizonTransactions.map(tx => tx.txid));
    const byTransaction = new Map(pending.map(receipt => [receipt.txHash, receipt]));

    const rows = horizonTransactions.map(tx => {
        const receipt = byTransaction.get(tx.txid);

        return receipt ? utils.withContractTokenTransfers(tx, receipt.tokens, descriptor) : tx;
    });
    const received = pending
        .filter(({ txHash }) => !listed.has(txHash))
        .map(receipt => utils.transformContractTokenReceipt(receipt, receipt.tokens, descriptor));

    const transactions = [...rows, ...received]
        .sort((a, b) => (b.blockHeight ?? 0) - (a.blockHeight ?? 0))
        .slice(0, pageSize);

    // A page keeps a prefix of the merged order, so everything above its oldest ledger is listed.
    const listedNow = new Set(transactions.map(tx => tx.txid));
    const consumed = pending.filter(({ txHash }) => listedNow.has(txHash));
    const oldestLedger = Math.min(...consumed.map(({ ledger }) => ledger));

    return {
        transactions,
        horizonRowsKept: transactions.filter(tx => listed.has(tx.txid)).length,
        position: consumed.length
            ? {
                  ledger: oldestLedger,
                  txHashes: [
                      ...(position?.ledger === oldestLedger ? position.txHashes : []),
                      ...consumed
                          .filter(({ ledger }) => ledger === oldestLedger)
                          .map(({ txHash }) => txHash),
                  ],
              }
            : position,
    };
};
