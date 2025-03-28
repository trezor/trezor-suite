import {
    Account,
    Address,
    ClusterUrl,
    CompilableTransactionMessage,
    RpcFromTransport,
    RpcTransportFromClusterUrl,
    SolanaRpcApiFromTransport,
    Transaction,
    TransactionMessageWithBlockhashLifetime,
} from '@solana/kit';
import { StakeStateAccount } from '@solana-program/stake';

import { NetworkSymbol } from '@suite-common/wallet-config';
import type { SolanaSignTransaction } from '@trezor/connect';

export enum Network {
    Mainnet = 'mainnet-beta',
    Devnet = 'devnet',
}

export interface RpcConfig {
    rpc?: ClusterUrl;
    userAgent?: string;
}

export interface SolNetworkConfig {
    network: Network;
}

export type StakeResponse = {
    stakeTx:
        | (CompilableTransactionMessage & TransactionMessageWithBlockhashLifetime)
        | (Transaction & TransactionMessageWithBlockhashLifetime);
    stakeAccount: Address;
};

export type Delegations = Array<Account<StakeStateAccount, Address>>;

export type UnstakeResponse = {
    unstakeTx: CompilableTransactionMessage & TransactionMessageWithBlockhashLifetime;
    unstakeAmount: bigint;
};

export type Connection = RpcFromTransport<
    SolanaRpcApiFromTransport<RpcTransportFromClusterUrl<ClusterUrl>>,
    RpcTransportFromClusterUrl<ClusterUrl>
>;

export type ClaimResponse = {
    claimTx: CompilableTransactionMessage & TransactionMessageWithBlockhashLifetime;
    totalClaimAmount: bigint;
};

export type TransactionShim = {
    addSignature(signerPubKey: string, signatureHex: string): void;
    serializeMessage(): string;
    serialize(): string;
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

export interface StakeParams<T> {
    network: NetworkSymbol;
    sender: string;
    lamports: bigint;
    source: string;
    url?: string;
    params?: T;
}

export interface ClaimParams<T> {
    network: NetworkSymbol;
    sender: string;
    url?: string;
    params?: T;
}

export type SolanaTx = SolanaSignTransaction & {
    txShim: TransactionShim;
};
