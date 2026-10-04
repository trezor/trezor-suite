import type { AccountInfo, AccountInfoParams, Utxo } from '@trezor/blockchain-link-types';
import type { Result } from '@trezor/type-utils';

export type BackendError = {
    type: 'backend';
    message: string;
};

/**
 * The blockchain backend as the migration sees it. Everything it returns is untrusted input:
 * balances and UTXOs are verified against previous transactions before anything is signed.
 */
export type Backend = {
    getAccountInfo: (params: AccountInfoParams) => Promise<Result<AccountInfo, BackendError>>;
    /** Unspent outputs of an extended public key or of a single address. */
    getAccountUtxo: (descriptor: string) => Promise<Result<Utxo[], BackendError>>;
    getTransactionHex: (txid: string) => Promise<Result<string, BackendError>>;
    /** Broadcasts a signed transaction and resolves to the id the backend assigned to it. */
    pushTransaction: (hex: string) => Promise<Result<string, BackendError>>;
};
