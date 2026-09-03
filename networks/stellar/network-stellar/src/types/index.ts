import type { Horizon, Transaction } from '@stellar/stellar-sdk';

import type { identifyTransaction } from '../runtime/transactions/identify';

export type { TokenTransferInfo } from '../runtime/transactions/identify';
export type { StellarContractCallInfo } from '../runtime/transactions/decodeContractCall';

export type StellarAPI = Horizon.Server;

export type StellarTransaction = Transaction;

export type StellarLedgerRecord = Horizon.ServerApi.LedgerRecord;

export type IdentifiedTransaction = ReturnType<typeof identifyTransaction>;
