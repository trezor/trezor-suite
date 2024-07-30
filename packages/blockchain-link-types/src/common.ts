import type { SocksProxyAgentOptions } from 'socks-proxy-agent';

import type { Transaction as BlockbookTransaction, VinVout } from './blockbook';
import type {
    AddressAlias,
    TokenTransfer as BlockbookTokenTransfer,
    ContractInfo,
    StakingPool,
} from './blockbook-api';

/* Common types used in both params and responses */

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
}

export type TokenStandard = 'ERC20' | 'ERC1155' | 'ERC721' | 'SPL';

export type TransferType = 'sent' | 'recv' | 'self' | 'unknown';

/* Transaction */
export type TokenTransfer = Omit<BlockbookTokenTransfer, 'value'> & {
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

export interface FiatRatesBySymbol {
    [symbol: string]: number | undefined;
}

export interface AccountBalanceHistory {
    time: number;
    txs: number;
    received: string;
    sent: string;
    sentToSelf?: string; // should always be there for blockbook >= 0.3.3
    rates: FiatRatesBySymbol;
}

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
        subtype?: 'withdrawal' | 'stake_delegation' | 'stake_registration' | 'stake_deregistration';
        withdrawal?: string;
        deposit?: string;
    };
    solanaSpecific?: {
        status: 'confirmed';
    };
    details: TransactionDetail;
    vsize?: number;
    feeRate?: string;
}

/* Account */

export type AnonymitySet = Record<string, number | undefined>;

export interface Address {
    address: string;
    path: string;
    transfers: number;
    // decimal: number,
    balance?: string;
    sent?: string;
    received?: string;
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
    amount: string;
    blockHeight: number;
    address: string;
    path: string;
    confirmations: number;
    coinbase?: boolean;
    cardanoSpecific?: {
        unit: string;
    };
}

export interface TokenAccount {
    publicKey: string;
    balance: string;
}

export interface TokenInfo {
    type: string; // token type: ERC20...
    contract: string; // token address, token unit for ADA
    balance?: string; // token balance
    name?: string; // token name
    symbol?: string; // token symbol
    decimals: number; // token decimals or 0
    accounts?: TokenAccount[]; // token accounts for solana
    policyId?: string; // Cardano policy id
    fingerprint?: string; // Cardano starting with "asset"
    // transfers: number, // total transactions?
}

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
        reserve?: string;
        // blockfrost
        rewards?: string;
        // ADA
        staking?: {
            address: string;
            isActive: boolean;
            rewards: string;
            poolId: string | null;
        };
        // SOL
        owner?: string; // The Solana program owning the account
        rent?: number; // The rent required for the account to opened
    };
    page?: {
        // blockbook and blockfrost
        index: number;
        size: number;
        total: number;
    };
    marker?: {
        // ripple-lib
        ledger: number;
        seq: number;
    };
}

export interface SubscriptionAccountInfo {
    descriptor: string;
    addresses?: AccountAddresses; // bitcoin addresses
    subscriptionId?: number;
    tokens?: TokenInfo[]; // solana tokens
}

export type ChannelMessage<T> = T & { id: number };
