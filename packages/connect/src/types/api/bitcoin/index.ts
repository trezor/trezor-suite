import type { PROTO } from '../../../constants';
import type { AccountAddresses } from '@trezor/blockchain-link';

// signMessage

export interface SignMessage {
    path: string | number[];
    coin: string;
    message: string;
    hex?: boolean;
    no_script_type?: boolean;
}

// signTransaction

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
    amount_unit?: PROTO.AmountUnit;
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
    preauthorized?: boolean;
    amountUnit?: PROTO.AmountUnit;
    unlockPath?: PROTO.UnlockPath;
}

export type SignedTransaction = {
    signatures: string[];
    serializedTx: string;
    witnesses?: (string | undefined)[];
    txid?: string;
};

// verifyMessage

export interface VerifyMessage {
    address: string;
    signature: string;
    message: string;
    coin: string;
    hex?: boolean;
}
