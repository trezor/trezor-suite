import type { Transaction } from '@trezor/blockchain-link-types';

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
    amount: string;
    decimals: number | null;
    symbol: string | null;
    standard: string | null;
    fromAddress: string | null;
    toAddress: string | null;
};

type UnindexedTransfer = Omit<FlatTransfer, 'idx'>;

const toNativeTransfer = (transaction: Transaction): UnindexedTransfer[] =>
    // A token-only transaction moves no coin of its own; its fee stays on the transaction.
    transaction.amount === '0'
        ? []
        : [
              {
                  kind: 'native',
                  contract: null,
                  direction: transaction.type,
                  amount: transaction.amount,
                  decimals: null,
                  symbol: null,
                  standard: null,
                  // A UTXO transaction has no single counterparty; the targets stay in `data`.
                  fromAddress: null,
                  toAddress: null,
              },
          ];

/** Every asset movement of a transaction, flat, so per-asset history is a plain query. */
export const flattenTransfers = (transaction: Transaction): FlatTransfer[] =>
    [
        ...toNativeTransfer(transaction),
        ...transaction.tokens.map((token): UnindexedTransfer => ({
            kind: 'token',
            contract: token.contract,
            direction: token.type,
            amount: token.amount,
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
            decimals: null,
            symbol: null,
            standard: null,
            fromAddress: internal.from,
            toAddress: internal.to,
        })),
    ].map((transfer, idx) => ({ idx, ...transfer }));
