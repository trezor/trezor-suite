import type { SocksProxyAgentOptions } from 'socks-proxy-agent';

import type { BaseCurrencyCode } from './baseCurrency';
import type { TokenProtocols, TronAccountExtraData, TronChainExtraData } from './blockbook-api';

/* Shared types — canonical definitions used by both common and backend-specific modules */

export interface SolanaStakingAccount {
    status: string;
    stake?: string;
    rentExemptReserve: string;
    voterPubkey?: string;
}

export type TokenStandard =
    | 'TRC10'
    | 'ERC20'
    | 'TRC20'
    | 'BEP20'
    | 'ERC721'
    | 'TRC721'
    | 'BEP721'
    | 'ERC1155'
    | 'TRC1155'
    | 'BEP1155'
    | 'SPL'
    | 'SPL-2022'
    | 'BLOCKFROST'
    | 'STELLAR-CLASSIC';

export type FiatRatesBySymbol = {
    [K in BaseCurrencyCode]?: number | undefined;
};

export interface VinVout {
    txid?: string;
    vout?: number;
    sequence?: number;
    n: number;
    addresses?: string[];
    isAddress: boolean;
    isOwn?: boolean;
    value?: string;
    hex?: string;
    asm?: string;
    coinbase?: string;
    spent?: boolean;
    spentTxId?: string;
    spentIndex?: number;
    spentHeight?: number;
    type?: string;
}

export interface AccountBalanceHistory {
    time: number;
    txs: number;
    received: string;
    sent: string;
    sentToSelf?: string;
    rates: FiatRatesBySymbol;
}

export interface MultiTokenValue {
    id?: string;
    value?: string;
}

export interface AddressAlias {
    Type: string;
    Alias: string;
}

export interface EthereumInternalTransfer {
    type: number;
    from: string;
    to: string;
    value: string;
}

export interface EthereumParsedInputParam {
    type: string;
    values?: string[];
}

export interface EthereumParsedInputData {
    methodId: string;
    name: string;
    function?: string;
    params?: EthereumParsedInputParam[];
}

export interface EthereumSpecific {
    type?: number;
    createdContract?: string;
    status: number;
    error?: string;
    nonce: number;
    gasLimit: number;
    gasUsed?: number;
    gasPrice?: string;
    maxPriorityFeePerGas?: string;
    maxFeePerGas?: string;
    baseFeePerGas?: string;
    l1Fee?: number;
    l1FeeScalar?: string;
    l1GasPrice?: string;
    l1GasUsed?: number;
    data?: string;
    parsedData?: EthereumParsedInputData;
    internalTransfers?: EthereumInternalTransfer[];
}

export interface StakingPool {
    contract: string;
    name: string;
    pendingBalance: string;
    pendingDepositedBalance: string;
    depositedBalance: string;
    withdrawTotalAmount: string;
    claimableAmount: string;
    restakedReward: string;
    autocompoundBalance: string;
}

export interface ContractInfo {
    /** @deprecated: Use standard instead. */
    type: '' | 'XPUBAddress' | 'ERC20' | 'ERC721' | 'ERC1155' | 'BEP20' | 'BEP721' | 'BEP1155';
    standard: '' | 'XPUBAddress' | 'ERC20' | 'ERC721' | 'ERC1155' | 'BEP20' | 'BEP721' | 'BEP1155';
    contract: string;
    name: string;
    symbol: string;
    decimals: number;
    createdInBlock?: number;
    destructedInBlock?: number;
}

/* Common types used in both params and responses */

export interface BlockchainSettings {
    name: string;
    worker: string | (() => any);
    server: string[];
    proxy?: { uri: string | URL; opts?: SocksProxyAgentOptions };
    debug?: boolean;
    timeout?: number;
    pingTimeout?: number;
    keepAlive?: boolean;
    throttleBlockEvent?: number;
}

/**
 * Discrepancy between `ServerInfo` and `CoinInfo`
 *
 * `ServerInfo` type
 *   - `shortcut` is a label for a network (e.g. for BASE `shortcut` has value ETH)
 *   - `network` is unique symbol for a network (e.g. for BASE `network` has value BASE)
 *
 * `CoinInfo` type
 *   - `shortcut` is a unique network symbol
 *   - `network` are data about network
 */
export interface ServerInfo {
    url: string;
    name: string;
    shortcut: string;
    testnet: boolean;
    version: string;
    decimals: number;
    blockHeight: number;
    blockHash: string;
    consensusBranchId?: number; // zcash current branch id
    network: string;
}

export type TransferType = 'sent' | 'recv' | 'self' | 'unknown';

/* Transaction */
export interface TokenTransfer {
    type: TransferType;
    standard?: TokenStandard;
    amount: string;
    from: string;
    to: string;
    contract: string;
    name?: string;
    symbol?: string;
    decimals: number;
    multiTokenValues?: MultiTokenValue[];
}

export interface InternalTransfer {
    // we filter out addresses where from/to is not user's address except Everstake instant txs which are marked 'external'
    type: TransferType | 'external';
    amount: string;
    from: string;
    to: string;
}

export interface Target {
    n: number;
    addresses?: string[];
    isAddress: boolean;
    amount?: string;
    coinbase?: string;
    isAccountTarget?: boolean;
}

export type EnhancedVinVout = VinVout & {
    isAccountOwned?: boolean;
};

export type TransactionDetail = {
    vin: EnhancedVinVout[];
    vout: EnhancedVinVout[];
    size: number;
    totalInput: string;
    totalOutput: string;
};

export interface Transaction {
    type: 'sent' | 'recv' | 'self' | 'joint' | 'contract' | 'failed' | 'unknown';
    txid: string;
    hex?: string;
    blockTime?: number;
    blockHeight?: number;
    blockHash?: string;
    lockTime?: number;

    amount: string;
    fee: string;

    targets: Target[];
    tokens: TokenTransfer[];
    rbf?: boolean;
    ethereumSpecific?: EthereumSpecific;
    internalTransfers: InternalTransfer[];
    cardanoSpecific?: {
        subtype?:
            | 'withdrawal'
            | 'stake_delegation'
            | 'stake_registration'
            | 'stake_deregistration'
            | 'governance_delegation';
        withdrawal?: string;
        deposit?: string;
    };
    solanaSpecific?: {
        status: 'confirmed';
        stakeOperation?: { type: StakeType; amount: string };
        memo?: string;
    };
    details: TransactionDetail;
    vsize?: number;
    feeRate?: string;
    rippleSpecific?: {
        destinationTag?: number;
    };
    stellarSpecific?: {
        memo?: string;
        feeSource: string; // who paid the fee for the transaction
        operationType?: 'changeTrust';
        changeTrust?: {
            assetCode: string;
            isRemoval: boolean;
        };
    };
    tronSpecific?: TronChainExtraData;
}

/* Account */

export type AnonymitySet = Record<string, number | undefined>;

export interface Address {
    address: string;
    path: string;
    transfers: number;
    // decimal: number,
    balance: string;
    sent: string;
    received: string;
}

export interface AccountAddresses {
    change: Address[];
    used: Address[];
    unused: Address[];
    // NOTE: anonymitySet currently is not calculated by @trezor/blockchain-link
    // format: key -> address, value -> anonymityLevel
    anonymitySet?: AnonymitySet;
}

export interface Utxo {
    txid: string;
    vout: number;
    confirmations: number;
    address: string;
    path: string;
    coinbase?: boolean;
    amount: string;
    blockHeight: number;
    cardanoSpecific?: {
        unit: string;
    };
}

export interface TokenAccount {
    publicKey: string;
    balance: string;
}

export interface TokenInfo {
    standard: TokenStandard;
    name?: string;
    contract: string;
    symbol?: string;
    decimals: number;
    balance?: string;
    ids?: string[];
    multiTokenValues?: MultiTokenValue[];
    totalReceived?: string;
    totalSent?: string;
    accounts?: TokenAccount[];
    policyId?: string;
    fingerprint?: string;
    protocols?: TokenProtocols;
}

/**
 * One spendable output of a Monero account, as known to the view-only scanning wallet. It carries
 * only what scanning reveals; the data needed to actually spend it (the output's position within its
 * source transaction and that transaction's public key(s)) is resolved separately from the source
 * transaction. Confidential — never log or send off-device (CLAUDE.md).
 */
export interface MoneroSpendableOutput {
    amount: string; // piconero, decimal string (a single output can exceed 2^53)
    globalIndex: number; // global RingCT output index (decoy selection + get_outs reference)
    subaddrMinor: number; // subaddress minor index the output was received on (0 = main address)
    stealthPublicKey: string; // the output's one-time public key, hex
    txHash: string; // hash of the transaction that created the output
    // Output still time-locked (coinbase / unlock_time not reached) → not yet spendable. Only ever
    // true in the unfiltered allOutputs set (key-image sync); the send filters these out itself.
    locked: boolean;
    // Output the wallet froze (wallet2 marks it unsafe to spend — manual freeze or key-image-reuse /
    // burning-bug defense). Like `locked`, only ever true in the allOutputs set; the send skips it.
    frozen: boolean;
}

/**
 * This is Backend data for the account. Data can change over time as transactions happen.
 * Suite is subscribed to this and updates Account regularly.
 */
export interface AccountInfo {
    descriptor: string;
    balance: string;
    availableBalance: string;
    empty: boolean;
    tokens?: TokenInfo[]; // ethereum and blockfrost tokens

    addresses?: AccountAddresses; // bitcoin and blockfrost addresses
    history: {
        total: number; // total transactions (unknown in ripple)
        tokens?: number; // tokens transactions
        unconfirmed: number; // unconfirmed transactions
        transactions?: Transaction[]; // list of transactions
        txids?: string[]; // not implemented
        addrTxCount?: number; // number of confirmed address/transaction pairs, only for bitcoin-like
    };
    misc?: {
        // EVM
        nonce?: string;
        confirmedNonce?: string;
        contractInfo?: ContractInfo;
        stakingPools?: StakingPool[];
        addressAliases?: { [key: string]: AddressAlias };
        // XRP
        sequence?: number;
        // Stellar
        stellarSequence?: string;
        baseReserve?: string;
        reserve?: string;
        // blockfrost
        rewards?: string;
        // ADA
        staking?: {
            address: string;
            isActive: boolean;
            rewards: string;
            poolId: string | null;
            drep: {
                drep_id: string;
                hex: string;
                amount: string;
                active: boolean;
                active_epoch: number | null;
                has_script: boolean;
            } | null;
        };
        // SOL
        owner?: string; // The Solana program owning the account
        rent?: number; // The rent required for the account to opened
        solStakingAccounts?: SolanaStakingAccount[]; // Solana staking accounts (Everstake)
        solExternalStakingAccounts?: SolanaStakingAccount[]; // Solana staking accounts (non-Everstake)
        solEpoch?: number; // Solana current epoch
        tronResources?: TronAccountExtraData;
        // Monero: progress of the client-side view-key scan (the local wallet catching up to the
        // node). Reported only once the scanning wallet exists; absent while it is still being built.
        moneroScan?: {
            scannedHeight: number; // last block the wallet has scanned
            chainHeight: number; // node's current height
            isSynced: boolean; // wallet has caught up to the node
            startHeight: number; // block the scan started from (resolved birthday); 0 = from genesis
            startTimestamp: number; // unix seconds of the start block (the "birthday"); 0 = unknown
        };
        // Monero: there is no persisted wallet for this account and no view key in hand, so the user
        // must pick a birthday and arm the scan (export the view key). Distinguishes "first run" from
        // "wallet is being opened/built" so the UI shows the birthday picker rather than a loader.
        moneroNeedsArm?: boolean;
        // Monero: the scanning wallet's raw spendable outputs, gathered on demand (gatherOutputs) for
        // the send flow. Carries only what the view-only wallet knows; the in-tx index and tx public
        // key(s) needed to spend each output are resolved later from its source transaction. These are
        // confidential (output keys, amounts) and must never be logged or sent off-device (CLAUDE.md).
        moneroOutputs?: MoneroSpendableOutput[];
        // Monero: the scanning wallet's private view key (32-byte hex), gathered on demand
        // (gatherOutputs) so the send pipeline can derive each input's commitment mask. HIGHLY
        // confidential — only ever populated on the send-internal getAccountInfo response (never the
        // Suite-facing path) and must never be logged or sent off-device (CLAUDE.md).
        moneroPrivateViewKey?: string;
    };
    page?: {
        // blockbook and blockfrost
        index: number;
        size: number;
        total: number;
    };
    marker?: {
        // xrpl.js
        ledger: number;
        seq: number;
    };
    stellarCursor?: string; // stellar only, cursor for pagination
}

export interface SubscriptionAccountInfo {
    descriptor: string;
    addresses?: AccountAddresses; // bitcoin addresses
    subscriptionId?: number;
    tokens?: TokenInfo[]; // solana tokens
}

export type ChannelMessage<T> = T & { id: number };

export type StakeType = 'stake' | 'unstake' | 'claim' | 'change-delegate';

export type TokenDetailByMint = {
    [mint: string]: {
        name: string;
        symbol: string;
        home_domain?: string;
        rating?: number;
    };
};
