import type { Horizon, Transaction } from '@stellar/stellar-sdk';

import type { StellarRpcServer } from './rpc';
import type { describeTransaction } from '../runtime/transactions/describe';
import type { identifyTransaction } from '../runtime/transactions/identify';

export type * from './account';
export type * from './rpc';

export type { StellarAssetAmount, TokenTransferInfo } from '../runtime/transactions/describe';
export type { StellarBalanceDelta } from '../runtime/transactions/balances';
export type { StellarContractTokenTransfer } from '../runtime/rpc/events';
export type * from './contractCall';
export type * from './operations';

export type StellarHorizonServer = Horizon.Server;

/** Both protocols served by the same origin. */
export interface StellarConnection {
    rpc: StellarRpcServer;
    horizon: StellarHorizonServer;
    isTestnet: boolean;
    passphrase: string;
    url: string;
}

export type StellarTransaction = Transaction;

export type StellarLedgerRecord = Horizon.ServerApi.LedgerRecord;

export type DescribedTransaction = ReturnType<typeof describeTransaction>;

// Horizon-only API of the current blockchain-link worker; goes away once it reads through StellarConnection.
export type StellarAPI = Horizon.Server;

export type RawStellarTransaction = Horizon.ServerApi.TransactionRecord;

export type IdentifiedTransaction = ReturnType<typeof identifyTransaction>;
