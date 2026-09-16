import type { rpc } from '@stellar/stellar-sdk';

// Re-exported so consumers need not depend on `@stellar/stellar-sdk` directly.
export type StellarRpcServer = rpc.Server;

export type StellarRpcLedgerEntry = rpc.Api.LedgerEntryResult;

export type StellarRpcSendTransactionResponse = rpc.Api.SendTransactionResponse;

export type StellarRpcGetTransactionResponse = rpc.Api.GetTransactionResponse;
