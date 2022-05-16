/**
 * Bitcoin and Bitcoin-like
 * Asks device to sign given inputs and outputs of pre-composed transaction.
 * User is asked to confirm all transaction details on Trezor.
 */

import type { AccountAddresses } from '@trezor/blockchain-link';
import type { PROTO } from '../../constants';
import type { Params, Response } from '../params';

// based on PROTO.TransactionType, with required fields
export type RefTransaction =
    | {
          hash: string;
          version: number;
          inputs: PROTO.PrevInput[];
          bin_outputs: PROTO.TxOutputBinType[];
          outputs?: typeof undefined;
          lock_time: number;
          extra_data?: string;
          expiry?: number;
          overwintered?: boolean;
          version_group_id?: number;
          timestamp?: number;
          branch_id?: number;
      }
    | {
          hash: string;
          version: number;
          inputs: PROTO.TxInput[];
          bin_outputs?: typeof undefined;
          outputs: PROTO.TxOutputType[];
          lock_time: number;
          extra_data?: string;
          expiry?: number;
          overwintered?: boolean;
          version_group_id?: number;
          timestamp?: number;
          branch_id?: number;
      };

// based on PROTO.SignTx, only optional fields
export interface TransactionOptions {
    version?: number;
    lock_time?: number;
    expiry?: number;
    overwintered?: boolean;
    version_group_id?: number;
    timestamp?: number;
    branch_id?: number;
    decred_staking_ticket?: boolean;
}

export interface SignTransaction {
    inputs: PROTO.TxInputType[];
    outputs: PROTO.TxOutputType[];
    paymentRequests?: PROTO.TxAckPaymentRequest[];
    refTxs?: RefTransaction[];
    account?: {
        addresses: AccountAddresses;
    };
    coin: string;
    locktime?: number;
    timestamp?: number;
    version?: number;
    expiry?: number;
    overwintered?: boolean;
    versionGroupId?: number;
    branchId?: number;
    decredStakingTicket?: boolean;
    push?: boolean;
}

export type SignedTransaction = {
    signatures: string[];
    serializedTx: string;
    txid?: string;
};

export declare function signTransaction(
    params: Params<SignTransaction>,
): Response<SignedTransaction>;
