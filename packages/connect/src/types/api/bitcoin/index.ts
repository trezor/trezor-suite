import type { AccountAddresses } from '@trezor/blockchain-link';
import type { Transaction as BlockbookTransaction } from '@trezor/blockchain-link-types/lib/blockbook';
import type { PROTO } from '../../../constants';
import type { AccountTransaction } from '../../account';
import { DerivationPath, ProtoWithDerivationPath } from '../../params';
import { Static, Type } from '@trezor/schema-utils';

// signMessage

export type SignMessage = Static<typeof SignMessage>;
export const SignMessage = Type.Object({
    path: DerivationPath,
    coin: Type.Optional(Type.String()),
    message: Type.String(),
    hex: Type.Optional(Type.Boolean()),
    no_script_type: Type.Optional(Type.Boolean()),
});

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
    serialize?: boolean;
    coinjoin_request?: PROTO.CoinJoinRequest;
    chunkify?: boolean;
}

export interface SignTransaction {
    inputs: ProtoWithDerivationPath<PROTO.TxInputType>[];
    outputs: ProtoWithDerivationPath<PROTO.TxOutputType>[];
    paymentRequests?: PROTO.TxAckPaymentRequest[];
    refTxs?: RefTransaction[];
    account?: {
        addresses: AccountAddresses;
        transactions?: AccountTransaction[]; // refTxs in different format. see refTxs/validateReferencedTransactions
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
    serialize?: boolean;
    coinjoinRequest?: PROTO.CoinJoinRequest;
    chunkify?: boolean;
}

export type SignedTransaction = {
    signatures: string[];
    serializedTx: string;
    witnesses?: (string | undefined)[];
    txid?: string;
    signedTransaction?: BlockbookTransaction;
};

// verifyMessage

export type VerifyMessage = Static<typeof VerifyMessage>;
export const VerifyMessage = Type.Object({
    address: Type.String(),
    signature: Type.String(),
    message: Type.String(),
    coin: Type.String(),
    hex: Type.Optional(Type.Boolean()),
});
