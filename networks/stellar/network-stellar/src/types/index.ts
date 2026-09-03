import type { Horizon, Transaction } from '@stellar/stellar-sdk';

import type { identifyTransaction } from '../runtime/transactions/identify';

export type * from './account';
export type * from './rpc';

export type { TokenTransferInfo } from '../runtime/transactions/identify';

export type StellarAPI = Horizon.Server;

export type StellarTransaction = Transaction;

export type StellarLedgerRecord = Horizon.ServerApi.LedgerRecord;

export type IdentifiedTransaction = ReturnType<typeof identifyTransaction>;
