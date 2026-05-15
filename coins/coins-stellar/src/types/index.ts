import type { Horizon, Transaction } from '@stellar/stellar-sdk';

import type { identifyTransaction } from '../runtime/transactions/identify';

export type StellarAPI = Horizon.Server;

export type StellarTransaction = Transaction;

export type RawStellarTransaction = Horizon.ServerApi.TransactionRecord;

export type IdentifiedTransaction = ReturnType<typeof identifyTransaction>;
