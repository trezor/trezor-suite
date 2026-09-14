import type { rpc } from '@stellar/stellar-sdk';

// Re-exported so consumers of this package never have to depend on @stellar/stellar-sdk
// directly, the way network-solana shields @solana/kit.
export type StellarRpcServer = rpc.Server;

export type StellarRpcLedgerEntry = rpc.Api.LedgerEntryResult;

export type StellarRpcSendTransactionResponse = rpc.Api.SendTransactionResponse;

export type StellarRpcGetTransactionResponse = rpc.Api.GetTransactionResponse;
