import type { Utxo } from '@trezor/blockchain-link-types';

const TXID_PATTERN = /^[0-9a-fA-F]{64}$/;
const AMOUNT_PATTERN = /^[1-9]\d*$/;

/** Path of an address inside an account: three hardened parts, the chain and the index. */
const ADDRESS_PATH_PATTERN = /^m(\/\d+'){3}\/[01]\/\d+$/;

/**
 * Checks the shape of an unspent output reported by the backend. The data arrives over the
 * network without any schema, so nothing is assumed about it before this passes.
 */
export const isWellFormedUtxo = (utxo: Utxo) =>
    typeof utxo.txid === 'string' &&
    TXID_PATTERN.test(utxo.txid) &&
    Number.isInteger(utxo.vout) &&
    utxo.vout >= 0 &&
    typeof utxo.amount === 'string' &&
    AMOUNT_PATTERN.test(utxo.amount) &&
    typeof utxo.path === 'string' &&
    ADDRESS_PATH_PATTERN.test(utxo.path);

/**
 * True only when the backend positively states that the output is in a block. A missing
 * height or confirmation count means unconfirmed, never the other way round.
 */
export const isConfirmedUtxo = ({ confirmations, blockHeight }: Utxo) =>
    Number.isInteger(confirmations) &&
    confirmations >= 1 &&
    Number.isInteger(blockHeight) &&
    blockHeight >= 1;
