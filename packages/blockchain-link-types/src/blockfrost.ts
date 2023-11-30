import type { AccountInfoParams, EstimateFeeParams, AccountBalanceHistoryParams } from './params';
import type { AccountBalanceHistory } from './common';

type TxContentUtxo = {
    /** Transaction hash */
    hash: string;
    inputs: {
        /** Input address */
        address: string;
        amount: AssetBalance[];
        /** Hash of the UTXO transaction */
        tx_hash: string;
        /** UTXO index in the transaction */
        output_index: number;
        /** The hash of the transaction output datum */
        data_hash: string | null;
        /** Whether the input is a collateral consumed on script validation failure */
        collateral: boolean;
    }[];
    outputs: {
        /** Output address */
        address: string;
        amount: AssetBalance[];
        /** UTXO index in the transaction */
        output_index: number;
        /** The hash of the transaction output datum */
        data_hash?: string | null;
    }[];
};

type AddressUtxoContent = {
    /** Transaction hash of the UTXO */
    tx_hash: string;
    /** UTXO index in the transaction */
    tx_index: number;
    /** UTXO index in the transaction */
    output_index: number;
    amount: AssetBalance[];
    /** Block hash of the UTXO */
    block: string;
    /** The hash of the transaction output datum */
    data_hash: string | null;
}[];

type TxContent = {
    /** Transaction hash */
    hash: string;
    /** Block hash */
    block: string;
    /** Block number */
    block_height: number;
    /** Block time */
    block_time: number;
    /** Slot number */
    slot: number;
    /** Transaction index within the block */
    index: number;
    output_amount: AssetBalance[];
    /** Fees of the transaction in Lovelaces */
    fees: string;
    /** Deposit within the transaction in Lovelaces */
    deposit: string;
    /** Size of the transaction in Bytes */
    size: number;
    /** Left (included) endpoint of the timelock validity intervals */
    invalid_before: string | null;
    /** Right (excluded) endpoint of the timelock validity intervals */
    invalid_hereafter: string | null;
    /** Count of UTXOs within the transaction */
    utxo_count: number;
    /** Count of the withdrawals within the transaction */
    withdrawal_count: number;
    /** Count of the MIR certificates within the transaction */
    mir_cert_count: number;
    /** Count of the delegations within the transaction */
    delegation_count: number;
    /** Count of the stake keys (de)registration and delegation certificates within the transaction */
    stake_cert_count: number;
    /** Count of the stake pool registration and update certificates within the transaction */
    pool_update_count: number;
    /** Count of the stake pool retirement certificates within the transaction */
    pool_retire_count: number;
    /** Count of asset mints and burns within the transaction */
    asset_mint_or_burn_count: number;
    /** Count of redeemers within the transaction */
    redeemer_count: number;
    /** True if contract script passed validation */
    valid_contract: boolean;
};

export type BlockContent = {
    /** Block creation time in UNIX time */
    time: number;
    /** Block number */
    height: number | null;
    /** Hash of the block */
    hash: string;
    /** Slot number */
    slot: number | null;
    /** Epoch number */
    epoch: number | null;
    /** Slot within the epoch */
    epoch_slot: number | null;
    /** Bech32 ID of the slot leader or specific block description in case there is no slot leader */
    slot_leader: string;
    /** Block size in Bytes */
    size: number;
    /** Number of transactions in the block */
    tx_count: number;
    /** Total output within the block in Lovelaces */
    output: string | null;
    /** Total fees within the block in Lovelaces */
    fees: string | null;
    /** VRF key of the block */
    block_vrf: string | null;
    /** Hash of the previous block */
    previous_block: string | null;
    /** Hash of the next block */
    next_block: string | null;
    /** Number of block confirmations */
    confirmations: number;
};

export interface Subscribe {
    subscribed: boolean;
}

export type Fee = {
    lovelacePerByte: number;
};

export interface Address {
    address: string;
    path: string;
    transfers: number;
    balance?: string;
    sent?: string;
    received?: string;
}

export interface AccountAddresses {
    change: Address[];
    used: Address[];
    unused: Address[];
}

export interface BlockfrostTransaction {
    address: string;
    txHash: string;
    txUtxos: TxContentUtxo;
    txData: TxContent;
}

export interface BlockfrostAccountInfo {
    balance: string;
    addresses: AccountAddresses;
    empty: boolean;
    availableBalance: string;
    descriptor: string;
    tokens?: AssetBalance[];
    history: {
        total: number;
        tokens?: number;
        unconfirmed: number;
        transactions?: BlockfrostTransaction[];
    };
    page: {
        size: number;
        total: number;
        index: number;
    };
}

export interface ParseAssetResult {
    policyId: string;
    assetName: string;
}

export interface AddressNotification {
    address: string;
    tx: any;
}

export interface ServerInfo {
    name: string;
    shortcut: string;
    testnet: boolean;
    version: string;
    decimals: number;
    blockHeight: number;
    blockHash: string;
}

export interface AccountUtxoParams {
    descriptor: string;
}

export type AccountUtxo = {
    txid: string;
    vout: number;
    value: string;
    height: number;
    address: string;
    path: string;
}[];

export interface UtxosData extends AddressUtxoContent {
    blockInformation: BlockContent;
}
export interface AssetBalance {
    /** The unit of the value */
    unit: string;
    /** The quantity of the unit */
    quantity: string;
    decimals: number;
    fingerprint?: string; // defined for all assets except lovelace
}

export type BlockfrostToken = {
    type: 'BLOCKFROST';
    name: string; // from unit or fingerprint
    contract: string; // unit
    symbol: string; // from unit or fingerprint
    balance: string; // quantity
    decimals: number; // decimals
};

export interface Output {
    address: string;
    amount: AssetBalance[];
}

export interface Input {
    address: string;
    amount: AssetBalance[];
}

export interface BlockfrostUtxoData {
    tx_hash: string;
    tx_index: number;
    output_index: number;
    amount: {
        unit: string;
        quantity: string;
    }[];
    block: string;
}

export interface BlockfrostUtxos {
    address: string;
    path: string;
    utxoData: BlockfrostUtxoData;
    blockInfo: BlockContent;
}

declare function FSend(method: 'GET_SERVER_INFO'): Promise<ServerInfo>;
declare function FSend(
    method: 'GET_BLOCK',
    params: { hashOrNumber: number | string },
): Promise<BlockContent>;
declare function FSend(
    method: 'GET_ACCOUNT_INFO',
    params: AccountInfoParams,
): Promise<BlockfrostAccountInfo>;
declare function FSend(
    method: 'GET_ACCOUNT_UTXO',
    params: AccountUtxoParams,
): Promise<BlockfrostUtxos[]>;
declare function FSend(method: 'GET_TRANSACTION', params: { txId: string }): Promise<TxContent>;
declare function FSend(method: 'PUSH_TRANSACTION', params: { txData: string }): Promise<string>;
declare function FSend(method: 'SUBSCRIBE_BLOCK'): Promise<Subscribe>;
declare function FSend(method: 'UNSUBSCRIBE_BLOCK'): Promise<Subscribe>;
declare function FSend(
    method: 'SUBSCRIBE_ADDRESS',
    params: { addresses: string[] },
): Promise<Subscribe>;
declare function FSend(method: 'UNSUBSCRIBE_ADDRESS'): Promise<Subscribe>;
declare function FSend(
    method: 'GET_BALANCE_HISTORY',
    params: AccountBalanceHistoryParams,
): Promise<AccountBalanceHistory[]>;
declare function FSend(method: 'ESTIMATE_FEE', params: EstimateFeeParams): Promise<Fee>;
export type Send = typeof FSend;
