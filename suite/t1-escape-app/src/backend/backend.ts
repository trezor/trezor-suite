import type {
    AccountInfo,
    AccountInfoParams,
    Transaction,
    Utxo,
} from '@trezor/blockchain-link-types';
import type { Result } from '@trezor/type-utils';

import type { EthereumChain } from '../ethereum/ethereumChain';

export type BackendError = {
    type: 'backend';
    message: string;
};

/**
 * One Ethereum-like blockbook, serving one chain. Everything it returns is untrusted input: the
 * signed transaction is verified against the composed plan, and the plan is never trusted to the
 * extent of signing while the backend reports the address as unsettled.
 */
export type EthereumBackend = {
    /** Balance, nonce, history counts and token balances of one address. */
    getAccountInfo: (address: string) => Promise<Result<AccountInfo, BackendError>>;
    /** Gas price the backend recommends for the next block, in wei per gas. */
    estimateGasPrice: () => Promise<Result<string, BackendError>>;
    /** Broadcasts a signed transaction and resolves to the id the backend assigned to it. */
    pushTransaction: (hex: string) => Promise<Result<string, BackendError>>;
    /** Fails when the backend does not know the transaction. */
    getTransaction: (txid: string) => Promise<Result<Transaction, BackendError>>;
};

/**
 * The blockchain backends as the migration sees them. Everything they return is untrusted input:
 * balances and UTXOs are verified against previous transactions before anything is signed.
 */
export type Backend = {
    getAccountInfo: (params: AccountInfoParams) => Promise<Result<AccountInfo, BackendError>>;
    /** Unspent outputs of an extended public key or of a single address. */
    getAccountUtxo: (descriptor: string) => Promise<Result<Utxo[], BackendError>>;
    getTransactionHex: (txid: string) => Promise<Result<string, BackendError>>;
    /** Broadcasts a signed transaction and resolves to the id the backend assigned to it. */
    pushTransaction: (hex: string) => Promise<Result<string, BackendError>>;
    /** The Ethereum-like chains, each served by its own blockbook. */
    ethereum: Record<EthereumChain, EthereumBackend>;
};
