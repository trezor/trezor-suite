import type { Transaction } from '@trezor/blockchain-link-types';
import { BigNumber } from '@trezor/utils';

export type TransferKind = 'native' | 'token' | 'internal';

/** One movement of one asset within a transaction, as a row of the `transfers` table. */
export type FlatTransfer = {
    /** Position within the transaction, so a transaction's rows keep their order. */
    idx: number;
    kind: TransferKind;
    /** `null` for the network's own coin, native or internal. */
    contract: string | null;
    /** The movement's own direction, which may differ from the transaction's. */
    direction: string;
    /** In base units, as the backend sent it. */
    amount: string;
    /** In units ("0.0012"), as people read and search for it; `null` when the decimals are unknown. */
    value: string | null;
    decimals: number | null;
    symbol: string | null;
    standard: string | null;
    fromAddress: string | null;
    toAddress: string | null;
};

type UnindexedTransfer = Omit<FlatTransfer, 'idx'>;

const toValue = (amount: string, decimals: number | undefined) => {
    if (decimals === undefined) return null;

    const value = new BigNumber(amount).shiftedBy(-decimals);

    return value.isNaN() ? null : value.toFixed();
};

const toNativeTransfer = (
    transaction: Transaction,
    networkDecimals: number | undefined,
): UnindexedTransfer[] =>
    // A token-only transaction moves no coin of its own; its fee stays on the transaction.
    transaction.amount === '0'
        ? []
        : [
              {
                  kind: 'native',
                  contract: null,
                  direction: transaction.type,
                  amount: transaction.amount,
                  value: toValue(transaction.amount, networkDecimals),
                  decimals: networkDecimals ?? null,
                  symbol: null,
                  standard: null,
                  // A UTXO transaction has no single counterparty; the targets stay in `data`.
                  fromAddress: null,
                  toAddress: null,
              },
          ];

/**
 * Every asset movement of a transaction, flat, so per-asset history is a plain query. The
 * network's decimals turn its coin's amounts into units; tokens carry their own.
 */
export const flattenTransfers = (
    transaction: Transaction,
    networkDecimals: number | undefined,
): FlatTransfer[] =>
    [
        ...toNativeTransfer(transaction, networkDecimals),
        ...transaction.tokens.map((token): UnindexedTransfer => ({
            kind: 'token',
            contract: token.contract,
            direction: token.type,
            amount: token.amount,
            value: toValue(token.amount, token.decimals),
            decimals: token.decimals,
            symbol: token.symbol ?? null,
            standard: token.standard ?? null,
            fromAddress: token.from,
            toAddress: token.to,
        })),
        ...transaction.internalTransfers.map((internal): UnindexedTransfer => ({
            kind: 'internal',
            contract: null,
            direction: internal.type,
            amount: internal.amount,
            value: toValue(internal.amount, networkDecimals),
            decimals: networkDecimals ?? null,
            symbol: null,
            standard: null,
            fromAddress: internal.from,
            toAddress: internal.to,
        })),
    ].map((transfer, idx) => ({ idx, ...transfer }));
