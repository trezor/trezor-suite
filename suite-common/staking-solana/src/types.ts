import {
    type Account,
    type Address,
    type ClusterUrl,
    type CompilableTransactionMessage,
    type RpcFromTransport,
    type RpcTransportFromClusterUrl,
    type SolanaRpcApiFromTransport,
    type Transaction,
    type TransactionMessageWithBlockhashLifetime,
} from '@solana/kit';
import { type StakeStateAccount } from '@solana-program/stake';

import { type SolanaTxMeta } from '@suite-common/staking-solana-types';
import { type NetworkSymbol } from '@suite-common/wallet-config';

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
    txMeta: SolanaTxMeta;
};

export type Delegations = Array<Account<StakeStateAccount, Address>>;

export type UnstakeResponse = {
    unstakeTx: CompilableTransactionMessage & TransactionMessageWithBlockhashLifetime;
    unstakeAmount: bigint;
    txMeta: SolanaTxMeta;
};

export type Connection = RpcFromTransport<
    SolanaRpcApiFromTransport<RpcTransportFromClusterUrl<ClusterUrl>>,
    RpcTransportFromClusterUrl<ClusterUrl>
>;

export type ClaimResponse = {
    claimTx: CompilableTransactionMessage & TransactionMessageWithBlockhashLifetime;
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
