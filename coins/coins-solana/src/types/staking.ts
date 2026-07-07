import type {
    Account,
    Address,
    ClusterUrl,
    RpcFromTransport,
    RpcTransportFromClusterUrl,
    SolanaRpcApiFromTransport,
    Transaction,
    TransactionMessage,
    TransactionMessageWithBlockhashLifetime,
    TransactionMessageWithFeePayer,
    TransactionWithLifetime,
    TransactionWithinSizeLimit,
} from '@solana/kit';
import type { StakeStateAccount } from '@solana-program/stake';

import type { Network, supportedSolanaNetworkSymbols } from '../constants';

export type SupportedSolanaNetworkSymbols = (typeof supportedSolanaNetworkSymbols)[number];

export type PriorityFees = {
    computeUnitPrice: bigint;
    computeUnitLimit: number;
};

export type TransactionShim = {
    addSignature(signerPubKey: string, signatureHex: string): void;
    serializeMessage(): string;
    serialize(): string;
};

export type SolanaTxMeta = {
    deviceAmountLamports: string;
    feeLamports: string;
    rentLamports: string;
    feeIncludingRentLamports: string;
};

export type Fee = {
    feePerUnit: string;
    feePerTx?: string;
    feeLimit?: string;
};

export interface PrepareStakeSolTxParams {
    from: string;
    amount: string;
    connection: Connection;
    validator: Address;
    estimatedFee?: Fee;
    // Everstake Wallet SDK source, identifies the integrating app for TVL attribution.
    source?: string;
}

export type PrepareClaimSolTxParams = Omit<PrepareStakeSolTxParams, 'amount' | 'validator'>;

export type PrepareStakeSolTxResponse =
    | {
          success: true;
          txShim: TransactionShim;
          solanaTxMeta: SolanaTxMeta;
      }
    | {
          success: false;
          errorMessage: string;
      };

export type EstimatedFee = {
    success: boolean;
    payload?: Fee;
};

export interface RpcConfig {
    rpc?: ClusterUrl;
    userAgent?: string;
}

export interface SolNetworkConfig {
    network: Network;
}

export type StakeResponse = {
    stakeTx:
        | (TransactionMessage &
              TransactionMessageWithFeePayer &
              TransactionMessageWithBlockhashLifetime)
        | (Transaction & TransactionWithinSizeLimit & TransactionWithLifetime);
    stakeAccount: Address;
    txMeta: SolanaTxMeta;
};

export type Delegations = Array<Account<StakeStateAccount, Address>>;

export type UnstakeResponse = {
    unstakeTx: TransactionMessage &
        TransactionMessageWithFeePayer &
        TransactionMessageWithBlockhashLifetime;
    unstakeAmount: bigint;
    txMeta: SolanaTxMeta;
};

export type Connection = RpcFromTransport<
    SolanaRpcApiFromTransport<RpcTransportFromClusterUrl<ClusterUrl>>,
    RpcTransportFromClusterUrl<ClusterUrl>
>;

export type ClaimResponse = {
    claimTx: TransactionMessage &
        TransactionMessageWithFeePayer &
        TransactionMessageWithBlockhashLifetime;
    totalClaimAmount: bigint;
    txMeta: SolanaTxMeta;
};

export type Params<Blockhash> = {
    computeUnitPrice?: bigint;
    computeUnitLimit?: number;
    epoch?: bigint;
    finalLatestBlockhash?: {
        /** a Hash as base-58 encoded string */
        blockhash: Blockhash;
        /** last block height at which the blockhash will be valid */
        lastValidBlockHeight: bigint;
    };
};

export interface ClaimParams<T> {
    connection: Connection;
    sender: string;
    params?: T;
}

export interface UnstakeParams<T> extends ClaimParams<T> {
    lamports: bigint;
    source: string;
}

export interface StakeParams<T> extends UnstakeParams<T> {
    validator: Address;
}
