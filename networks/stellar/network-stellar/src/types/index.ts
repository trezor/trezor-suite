import type { Horizon, Transaction } from '@stellar/stellar-sdk';

import type { StellarRpcServer } from './rpc';
import type { describeTransaction } from '../runtime/transactions/describe';

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
