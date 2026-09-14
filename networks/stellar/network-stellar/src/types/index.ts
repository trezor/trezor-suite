import type { Horizon, Transaction } from '@stellar/stellar-sdk';

import type { identifyTransaction } from '../runtime/transactions/identify';

export type { TokenTransferInfo } from '../runtime/transactions/identify';

export type StellarHorizonServer = Horizon.Server;

export type StellarAPI = StellarHorizonServer;

export type StellarTransaction = Transaction;

export type StellarLedgerRecord = Horizon.ServerApi.LedgerRecord;

export type IdentifiedTransaction = ReturnType<typeof identifyTransaction>;
