import type { Horizon, Transaction } from '@stellar/stellar-sdk';

import type { StellarRpcServer } from './rpc';
import type { identifyTransaction } from '../runtime/transactions/identify';

export type * from './account';
export type * from './rpc';

export type { TokenTransferInfo } from '../runtime/transactions/identify';
export type { StellarContractCallInfo } from '../runtime/transactions/decodeContractCall';

export type StellarHorizonServer = Horizon.Server;

/**
 * One handle over both protocols served by the same origin: Stellar RPC is the source of truth
 * for account state, Horizon serves transaction history.
 */
export interface StellarAPI {
    rpc: StellarRpcServer;
    horizon: StellarHorizonServer;
    isTestnet: boolean;
    passphrase: string;
    url: string;
}

export type StellarTransaction = Transaction;

export type StellarLedgerRecord = Horizon.ServerApi.LedgerRecord;

export type IdentifiedTransaction = ReturnType<typeof identifyTransaction>;
