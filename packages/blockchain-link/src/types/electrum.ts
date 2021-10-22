// ElectrumX API 1.4
// https://electrumx.readthedocs.io/en/latest/protocol-methods.html

type ServerFeatures = {
    genesis_hash: string;
    hash_function: string;
    protocol_min: string;
    protocol_max: string;
    server_version: string;
    pruning: number | null;
    hosts:
        | {
              tcp_port?: number | null;
              ssl_port?: number | null;
          }
        | {
              [address: string]: {
                  tcp_port?: number | null;
                  ssl_port?: number | null;
              };
          };
};

export type TxIn = {
    txid: string;
    vout: number;
    sequence: number;
    n?: number;
    scriptSig: unknown;
    txinwitness: unknown;
};

export type TxCoinbase = {
    coinbase: string;
    sequence: number;
};

export type TxOut = {
    value: number;
    n: number;
    scriptPubKey: {
        asm: string;
        hex: string;
        address?: string;
        addresses?: string[];
        type: 'nulldata' | 'pubkeyhash' | 'scripthash' | 'pubkey' | unknown;
    };
};

export type TransactionVerbose = {
    txid: string;
    hash: string;
    hex: string;
    blockhash: string;
    version: number;
    size: number;
    vsize: number;
    weight: number;
    locktime: number;
    confirmations: number;
    time: number;
    blocktime: number;
    vin: (TxIn | TxCoinbase)[];
    vout: TxOut[];
};

type Balance = { confirmed: number; unconfirmed: number };
type Tx = { tx_hash: string; height: number };
type MempoolTx = Tx & { fee: number };
export type HistoryTx = Tx | MempoolTx;
export type Utxo = Tx & { tx_pos: number; value: number };
export type BlockHeader = { height: number; hex: string };
type BlockHeaders = { count: number; max: number; hex: string };
type Listener<T> = (data: T) => void;
export type Version = [string, string];
export type Info = { url: string; version: Version; block: BlockHeader };
export type StatusChange = [string, string | null];

export interface ElectrumAPI {
    getInfo(): Info | undefined;
    on(event: 'blockchain.headers.subscribe', listener: Listener<BlockHeader[]>): void;
    on(event: 'blockchain.scripthash.subscribe', listener: Listener<StatusChange>): void;
    /** @deprecated 1.2 */
    on(event: 'blockchain.address.subscribe', listener: Listener<unknown>): void;
    /** @deprecated 1.0 */
    on(event: 'blockchain.numblocks.subscribe', listener: Listener<unknown>): void;
    /** @deprecated only for servers */
    on(event: 'server.peers.subscribe', listener: Listener<unknown>): void;
    off(event: 'blockchain.headers.subscribe', listener: Listener<BlockHeader[]>): void;
    off(event: 'blockchain.scripthash.subscribe', listener: Listener<StatusChange>): void;
    /** @deprecated 1.2 */
    off(event: 'blockchain.address.subscribe', listener: Listener<unknown>): void;
    /** @deprecated 1.0 */
    off(event: 'blockchain.numblocks.subscribe', listener: Listener<unknown>): void;
    /** @deprecated only for servers */
    off(event: 'server.peers.subscribe', listener: Listener<unknown>): void;
    request(
        method: 'server.version',
        client_name: string,
        protocol_version: string | [string, string]
    ): Promise<Version>;
    request(method: 'server.banner'): Promise<string>;
    request(method: 'server.ping'): Promise<null>;
    request(method: 'server.donation_address'): Promise<string>;
    request(method: 'server.features'): Promise<ServerFeatures>;
    request(method: 'server.peers.subscribe'): Promise<[string, string, string[]][]>;
    request(method: 'blockchain.scripthash.get_balance', scripthash: string): Promise<Balance>;
    request(method: 'blockchain.scripthash.get_history', scripthash: string): Promise<HistoryTx[]>;
    request(method: 'blockchain.scripthash.get_mempool', scripthash: string): Promise<MempoolTx[]>;
    request(method: 'blockchain.scripthash.listunspent', scripthash: string): Promise<Utxo[]>;
    request(method: 'blockchain.scripthash.subscribe', scripthash: string): Promise<string | null>;
    request(method: 'blockchain.scripthash.unsubscribe', scripthash: string): Promise<boolean>;
    request(method: 'blockchain.block.header', height: number, cp_height?: number): Promise<string>;
    request(
        method: 'blockchain.block.headers',
        start_height: number,
        count: number,
        cp_height?: number
    ): Promise<BlockHeaders>;
    request(method: 'blockchain.estimatefee', number: number): Promise<number>;
    request(method: 'blockchain.headers.subscribe'): Promise<BlockHeader>;
    request(method: 'blockchain.relayfee'): Promise<number>;
    request(method: 'blockchain.transaction.broadcast', raw_tx: string): Promise<string>;
    request(
        method: 'blockchain.transaction.get',
        tx_hash: string,
        verbose?: false
    ): Promise<string>;
    request(
        method: 'blockchain.transaction.get',
        tx_hash: string,
        verbose: true
    ): Promise<TransactionVerbose>;
    request(
        method: 'blockchain.transaction.get_merkle',
        tx_hash: string,
        height: number
    ): Promise<unknown>;
    request(method: 'mempool.get_fee_histogram'): Promise<unknown>;
    /** @deprecated 1.1 */
    request(
        method: 'blockchain.utxo.get_address',
        tx_hash: string,
        index: unknown
    ): Promise<unknown>;
    /** @deprecated 1.1 */
    request(method: 'blockchain.numblocks.subscribe'): Promise<unknown>;
    /** @deprecated 1.2 */
    request(method: 'blockchain.block.get_chunk', index: unknown): Promise<unknown>;
    /** @deprecated 1.2 */
    request(method: 'blockchain.address.get_balance', address: string): Promise<unknown>;
    /** @deprecated 1.2 */
    request(method: 'blockchain.address.get_history', address: string): Promise<unknown>;
    /** @deprecated 1.2 */
    request(method: 'blockchain.address.get_mempool', address: string): Promise<unknown>;
    /** @deprecated 1.2 */
    request(method: 'blockchain.address.listunspent', address: string): Promise<unknown>;
    /** @deprecated 1.2 */
    request(method: 'blockchain.address.subscribe', address: string): Promise<unknown>;
    /** @deprecated only for servers */
    request(method: 'server.add_peer', features: ServerFeatures): Promise<boolean>;
}
