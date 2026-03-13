import type tls from 'tls';

import type { OptionalKey, RequiredKey } from '@trezor/type-utils';

import type {
    AccountBalanceHistory,
    Transaction as BlockbookTransaction,
    FiatRatesBySymbol,
    TokenStandard,
    VinVout,
} from './blockbook';
import type {
    AddressAlias,
    Token as BlockbookToken,
    TokenTransfer as BlockbookTokenTransfer,
    Utxo as BlockbookUtxo,
    ContractInfo,
    StakingPool,
} from './blockbook-api';
import type { SolanaStakingAccount } from './solana';

/* Common types used in both params and responses */

type AgentOptions = {
    timeout?: number | undefined;
};

interface BaseSocksProxyAgentOptions {
    host?: string | null;
    port?: string | number | null;
    username?: string | null;
    tls?: tls.ConnectionOptions | null;
    ipaddress?: string;
    type: 4 | 5;
    userId?: string;
    password?: string;
}

// todo: connect10 here we are using the old `SocksProxyAgentOptions` from older version of socks-proxy-agent
// but we keep the old API so we do not introduce breaking changes.
interface SocksProxyAgentOptions extends AgentOptions, BaseSocksProxyAgentOptions {}

export interface BlockchainSettings {
    name: string;
    worker: string | (() => any);
    server: string[];
    proxy?: string | SocksProxyAgentOptions;
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

export type { AccountBalanceHistory, FiatRatesBySymbol, TokenStandard };

export type TransferType = 'sent' | 'recv' | 'self' | 'unknown';

/* Transaction */
export type TokenTransfer = Omit<BlockbookTokenTransfer, 'value' | 'type' | 'standard'> & {
    type: TransferType;
    standard?: TokenStandard;
    amount: string;
};

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
    ethereumSpecific?: BlockbookTransaction['ethereumSpecific'];
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

export type Utxo = Omit<
    RequiredKey<BlockbookUtxo, 'address' | 'path'>,
    'value' | 'height' | 'lockTime'
> & {
    amount: string;
    blockHeight: number;
    cardanoSpecific?: {
        unit: string;
    };
};

export interface TokenAccount {
    publicKey: string;
    balance: string;
}

export type TokenInfo = Omit<
    RequiredKey<OptionalKey<BlockbookToken, 'name'>, 'contract'>,
    'type' | 'standard' | 'path' | 'transfers' | 'baseValue' | 'secondaryValue'
> & {
    standard: TokenStandard;
    accounts?: TokenAccount[];
    policyId?: string;
    fingerprint?: string;
    // transfers: number, // total transactions?
};

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
        contractInfo?: ContractInfo;
        stakingPools?: StakingPool[];
        addressAliases?: { [key: string]: AddressAlias };
        // XRP
        sequence?: number;
        // Stellar
        stellarSequence?: string;
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
