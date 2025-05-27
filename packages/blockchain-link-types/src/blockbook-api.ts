/* Do not change, this code is generated from Golang structs */

export interface APIError {
    /** Human-readable error message describing the issue. */
    Text: string;
    /** Whether the error message can safely be shown to the end user. */
    Public: boolean;
}
export interface AddressAlias {
    /** Type of alias, e.g., user-defined name or contract name. */
    Type: string;
    /** Alias string for the address. */
    Alias: string;
}
export interface EthereumInternalTransfer {
    /** Type of internal transfer (CALL, CREATE, etc.). */
    type: number;
    /** Address from which the transfer originated. */
    from: string;
    /** Address to which the transfer was sent. */
    to: string;
    /** Value transferred internally (in Wei or base units). */
    value: string;
}
export interface EthereumParsedInputParam {
    /** Parameter type (e.g. 'uint256'). */
    type: string;
    /** List of stringified parameter values. */
    values?: string[];
}
export interface EthereumParsedInputData {
    /** First 4 bytes of the input data (method signature ID). */
    methodId: string;
    /** Parsed function name if recognized. */
    name: string;
    /** Full function signature (including parameter types). */
    function?: string;
    /** List of parsed parameters for this function call. */
    params?: EthereumParsedInputParam[];
}
export interface EthereumSpecific {
    /** High-level type of the Ethereum tx (e.g., 'call', 'create'). */
    type?: number;
    /** Address of contract created by this transaction, if any. */
    createdContract?: string;
    /** Execution status of the transaction (1: success, 0: fail, -1: pending). */
    status: number;
    /** Error encountered during execution, if any. */
    error?: string;
    /** Transaction nonce (sequential number from the sender). */
    nonce: number;
    /** Maximum gas allowed by the sender for this transaction. */
    gasLimit: number;
    /** Actual gas consumed by the transaction execution. */
    gasUsed?: number;
    /** Price (in Wei or base units) per gas unit. */
    gasPrice?: string;
    maxPriorityFeePerGas?: string;
    maxFeePerGas?: string;
    baseFeePerGas?: string;
    /** Fee used for L1 part in rollups (e.g. Optimism). */
    l1Fee?: number;
    /** Scaling factor for L1 fees in certain Layer 2 solutions. */
    l1FeeScalar?: string;
    /** Gas price for L1 component, if applicable. */
    l1GasPrice?: string;
    /** Amount of gas used in L1 for this tx, if applicable. */
    l1GasUsed?: number;
    /** Hex-encoded input data for the transaction. */
    data?: string;
    /** Decoded transaction data (function name, params, etc.). */
    parsedData?: EthereumParsedInputData;
    /** List of internal (sub-call) transfers. */
    internalTransfers?: EthereumInternalTransfer[];
}
export interface MultiTokenValue {
    /** Token ID (for ERC1155). */
    id?: string;
    /** Amount of that specific token ID. */
    value?: string;
}
export interface TokenTransfer {
    /** @deprecated: Use standard instead. */
    type: '' | 'XPUBAddress' | 'ERC20' | 'ERC721' | 'ERC1155' | 'BEP20' | 'BEP721' | 'BEP1155';
    standard: '' | 'XPUBAddress' | 'ERC20' | 'ERC721' | 'ERC1155' | 'BEP20' | 'BEP721' | 'BEP1155';
    /** Source address of the token transfer. */
    from: string;
    /** Destination address of the token transfer. */
    to: string;
    /** Contract address of the token. */
    contract: string;
    /** Token name. */
    name?: string;
    /** Token symbol. */
    symbol?: string;
    /** Number of decimals for this token (if applicable). */
    decimals: number; // it is optional #14796
    /** Amount (in base units) of tokens transferred. */
    value?: string;
    /** List of multiple ID-value pairs for ERC1155 transfers. */
    multiTokenValues?: MultiTokenValue[];
}
export interface Vout {
    /** Amount (in satoshi or base units) of the output. */
    value?: string;
    /** Relative index of this output within the transaction. */
    n: number;
    /** Indicates whether this output has been spent. */
    spent?: boolean;
    /** Transaction ID in which this output was spent. */
    spentTxId?: string;
    /** Index of the input that spent this output. */
    spentIndex?: number;
    /** Block height at which this output was spent. */
    spentHeight?: number;
    /** Raw script hex data for this output - aka ScriptPubKey. */
    hex?: string;
    /** Disassembled script for this output. */
    asm?: string;
    /** List of addresses associated with this output. */
    addresses: string[];
    /** Indicates whether this output is owned by valid address. */
    isAddress: boolean;
    /** Indicates if this output belongs to the wallet in context. */
    isOwn?: boolean;
    /** Output script type (e.g., 'P2PKH', 'P2SH'). */
    type?: string;
}
export interface Vin {
    /** ID/hash of the originating transaction (where the UTXO comes from). */
    txid?: string;
    /** Index of the output in the referenced transaction. */
    vout?: number;
    /** Sequence number for this input (e.g. 4294967293). */
    sequence?: number;
    /** Relative index of this input within the transaction. */
    n: number;
    /** List of addresses associated with this input. */
    addresses?: string[];
    /** Indicates if this input is from a known address. */
    isAddress: boolean;
    /** Indicates if this input belongs to the wallet in context. */
    isOwn?: boolean;
    /** Amount (in satoshi or base units) of the input. */
    value?: string;
    /** Raw script hex data for this input. */
    hex?: string;
    /** Disassembled script for this input. */
    asm?: string;
    /** Data for coinbase inputs (when mining). */
    coinbase?: string;
}
export interface Tx {
    /** Transaction ID (hash). */
    txid: string;
    /** Version of the transaction (if applicable). */
    version?: number;
    /** Locktime indicating earliest time/height transaction can be mined. */
    lockTime?: number;
    /** Array of inputs for this transaction. */
    vin: Vin[];
    /** Array of outputs for this transaction. */
    vout: Vout[];
    /** Hash of the block containing this transaction. */
    blockHash?: string;
    /** Block height in which this transaction was included. */
    blockHeight: number;
    /** Number of confirmations (blocks mined after this tx's block). */
    confirmations: number;
    /** Estimated blocks remaining until confirmation (if unconfirmed). */
    confirmationETABlocks?: number;
    /** Estimated seconds remaining until confirmation (if unconfirmed). */
    confirmationETASeconds?: number;
    /** Unix timestamp of the block in which this transaction was included. 0 if unconfirmed. */
    blockTime: number;
    /** Transaction size in bytes. */
    size?: number;
    /** Virtual size in bytes, for SegWit-enabled chains. */
    vsize?: number;
    /** Total value of all outputs (in satoshi or base units). */
    value: string;
    /** Total value of all inputs (in satoshi or base units). */
    valueIn?: string;
    /** Transaction fee (inputs - outputs). */
    fees?: string;
    /** Raw hex-encoded transaction data. */
    hex?: string;
    /** Indicates if this transaction is replace-by-fee (RBF) enabled. */
    rbf?: boolean;
    /** Blockchain-specific extended data. */
    coinSpecificData?: any;
    /** List of token transfers that occurred in this transaction. */
    tokenTransfers?: TokenTransfer[];
    /** Ethereum-like blockchain specific data (if applicable). */
    ethereumSpecific?: EthereumSpecific;
    /** Aliases for addresses involved in this transaction. */
    addressAliases?: { [key: string]: AddressAlias };
}
export interface FeeStats {
    /** Number of transactions in the given block. */
    txCount: number;
    /** Sum of all fees in satoshi or base units. */
    totalFeesSat: string;
    /** Average fee per kilobyte in satoshi or base units. */
    averageFeePerKb: number;
    /** Fee distribution deciles (0%..100%) in satoshi or base units per kB. */
    decilesFeePerKb: number[];
}
export interface StakingPool {
    /** Staking pool contract address on-chain. */
    contract: string;
    /** Name of the staking pool contract. */
    name: string;
    /** Balance pending deposit or withdrawal, if any. */
    pendingBalance: string;
    /** Any pending deposit that is not yet finalized. */
    pendingDepositedBalance: string;
    /** Currently deposited/staked balance. */
    depositedBalance: string;
    /** Total amount withdrawn from this pool by the address. */
    withdrawTotalAmount: string;
    /** Rewards or principal currently claimable by the address. */
    claimableAmount: string;
    /** Total rewards that have been restaked automatically. */
    restakedReward: string;
    /** Any balance automatically reinvested into the pool. */
    autocompoundBalance: string;
}
export interface ContractInfo {
    /** @deprecated: Use standard instead. */
    type: '' | 'XPUBAddress' | 'ERC20' | 'ERC721' | 'ERC1155' | 'BEP20' | 'BEP721' | 'BEP1155';
    standard: '' | 'XPUBAddress' | 'ERC20' | 'ERC721' | 'ERC1155' | 'BEP20' | 'BEP721' | 'BEP1155';
    /** Smart contract address. */
    contract: string;
    /** Readable name of the contract. */
    name: string;
    /** Symbol for tokens under this contract, if applicable. */
    symbol: string;
    /** Number of decimal places, if applicable. */
    decimals: number;
    /** Block height where contract was first created. */
    createdInBlock?: number;
    /** Block height where contract was destroyed (if any). */
    destructedInBlock?: number;
}
export interface Token {
    /** @deprecated: Use standard instead. */
    type: '' | 'XPUBAddress' | 'ERC20' | 'ERC721' | 'ERC1155' | 'BEP20' | 'BEP721' | 'BEP1155';
    standard: '' | 'XPUBAddress' | 'ERC20' | 'ERC721' | 'ERC1155' | 'BEP20' | 'BEP721' | 'BEP1155';
    /** Readable name of the token. */
    name: string;
    /** Derivation path if this token is derived from an XPUB-based address. */
    path?: string;
    /** Contract address on-chain. */
    contract?: string;
    /** Total number of token transfers for this address. */
    transfers: number;
    /** Symbol for the token (e.g., 'ETH', 'USDT'). */
    symbol?: string;
    /** Number of decimals for this token. */
    decimals: number; // it is optional #14796
    /** Current token balance (in minimal base units). */
    balance?: string;
    /** Value in the base currency (e.g. ETH for ERC20 tokens). */
    baseValue?: number;
    /** Value in a secondary currency (e.g. fiat), if available. */
    secondaryValue?: number;
    /** List of token IDs (for ERC721, each ID is a unique collectible). */
    ids?: string[];
    /** Multiple ERC1155 token balances (id + value). */
    multiTokenValues?: MultiTokenValue[];
    /** Total amount of tokens received. */
    totalReceived?: string;
    /** Total amount of tokens sent. */
    totalSent?: string;
}
export interface Address {
    /** Current page index. */
    page?: number;
    /** Total number of pages available. */
    totalPages?: number;
    /** Number of items returned on this page. */
    itemsOnPage?: number;
    /** The address string in standard format. */
    address: string;
    /** Current confirmed balance (in satoshi or base units). */
    balance: string;
    /** Total amount ever received by this address. */
    totalReceived?: string;
    /** Total amount ever sent by this address. */
    totalSent?: string;
    /** Unconfirmed balance for this address. */
    unconfirmedBalance: string;
    /** Number of unconfirmed transactions for this address. */
    unconfirmedTxs: number;
    /** Unconfirmed outgoing balance for this address. */
    unconfirmedSending?: string;
    /** Unconfirmed incoming balance for this address. */
    unconfirmedReceiving?: string;
    /** Number of transactions for this address (including confirmed). */
    txs: number;
    /** Historical total count of transactions, if known. */
    addrTxCount?: number;
    /** Number of transactions not involving tokens (pure coin transfers). */
    nonTokenTxs?: number;
    /** Number of internal transactions (e.g., Ethereum calls). */
    internalTxs?: number;
    /** List of transaction details (if requested). */
    transactions?: Tx[];
    /** List of transaction IDs (if detailed data is not requested). */
    txids?: string[];
    /** Current transaction nonce for Ethereum-like addresses. */
    nonce?: string;
    /** Number of tokens with any historical usage at this address. */
    usedTokens?: number;
    /** List of tokens associated with this address. */
    tokens?: Token[];
    /** Total value of the address in secondary currency (e.g. fiat). */
    secondaryValue?: number;
    /** Sum of token values in base currency. */
    tokensBaseValue?: number;
    /** Sum of token values in secondary currency (fiat). */
    tokensSecondaryValue?: number;
    /** Address's entire value in base currency, including tokens. */
    totalBaseValue?: number;
    /** Address's entire value in secondary currency, including tokens. */
    totalSecondaryValue?: number;
    /** Extra info if the address is a contract (ABI, type). */
    contractInfo?: ContractInfo;
    /** @deprecated: replaced by contractInfo */
    erc20Contract?: ContractInfo;
    /** Aliases assigned to this address. */
    addressAliases?: { [key: string]: AddressAlias };
    /** List of staking pool data if address interacts with staking. */
    stakingPools?: StakingPool[];
}
export interface Utxo {
    /** Transaction ID in which this UTXO was created. */
    txid: string;
    /** Index of the output in that transaction. */
    vout: number;
    /** Value of this UTXO (in satoshi or base units). */
    value: string;
    /** Block height in which the UTXO was confirmed. */
    height?: number;
    /** Number of confirmations for this UTXO. */
    confirmations: number;
    /** Address to which this UTXO belongs. */
    address?: string;
    /** Derivation path for XPUB-based wallets, if applicable. */
    path?: string;
    /** If non-zero, locktime required before spending this UTXO. */
    lockTime?: number;
    /** Indicates if this UTXO originated from a coinbase transaction. */
    coinbase?: boolean;
}
export interface BalanceHistory {
    /** Unix timestamp for this point in the balance history. */
    time: number;
    /** Number of transactions in this interval. */
    txs: number;
    /** Amount received in this interval (in satoshi or base units). */
    received: string;
    /** Amount sent in this interval (in satoshi or base units). */
    sent: string;
    /** Amount sent to the same address (self-transfer). */
    sentToSelf: string;
    /** Exchange rates at this point in time, if available. */
    rates?: { [key: string]: number };
    /** Transaction ID if the time corresponds to a specific tx. */
    txid?: string;
}
export interface BlockInfo {
    Hash: string;
    Time: number;
    Txs: number;
    Size: number;
    Height: number;
}
export interface Blocks {
    /** Current page index. */
    page?: number;
    /** Total number of pages available. */
    totalPages?: number;
    /** Number of items returned on this page. */
    itemsOnPage?: number;
    /** List of blocks. */
    blocks: BlockInfo[];
}
export interface Block {
    /** Current page index. */
    page?: number;
    /** Total number of pages available. */
    totalPages?: number;
    /** Number of items returned on this page. */
    itemsOnPage?: number;
    /** Block hash. */
    hash: string;
    /** Hash of the previous block in the chain. */
    previousBlockHash?: string;
    /** Hash of the next block, if known. */
    nextBlockHash?: string;
    /** Block height (0-based index in the chain). */
    height: number;
    /** Number of confirmations of this block (distance from best chain tip). */
    confirmations: number;
    /** Size of the block in bytes. */
    size: number;
    /** Timestamp of when this block was mined. */
    time?: number;
    /** Block version (chain-specific meaning). */
    version: string;
    /** Merkle root of the block's transactions. */
    merkleRoot: string;
    /** Nonce used in the mining process. */
    nonce: string;
    /** Compact representation of the target threshold. */
    bits: string;
    /** Difficulty target for mining this block. */
    difficulty: string;
    /** List of transaction IDs included in this block. */
    tx?: string[];
    /** Total count of transactions in this block. */
    txCount: number;
    /** List of full transaction details (if requested). */
    txs?: Tx[];
    /** Optional aliases for addresses found in this block. */
    addressAliases?: { [key: string]: AddressAlias };
}
export interface BlockRaw {
    /** Hex-encoded block data. */
    hex: string;
}
export interface BackendInfo {
    /** Error message if something went wrong in the backend. */
    error?: string;
    /** Name of the chain - e.g. 'main'. */
    chain?: string;
    /** Number of fully verified blocks in the chain. */
    blocks?: number;
    /** Number of block headers in the chain. */
    headers?: number;
    /** Hash of the best block in hex. */
    bestBlockHash?: string;
    /** Current difficulty of the network. */
    difficulty?: string;
    /** Size of the blockchain data on disk in bytes. */
    sizeOnDisk?: number;
    /** Version of the blockchain backend - e.g. '280000'. */
    version?: string;
    /** Subversion of the blockchain backend - e.g. '/Satoshi:28.0.0/'. */
    subversion?: string;
    /** Protocol version of the blockchain backend - e.g. '70016'. */
    protocolVersion?: string;
    /** Time offset (in seconds) reported by the backend. */
    timeOffset?: number;
    /** Any warnings given by the backend regarding the chain state. */
    warnings?: string;
    /** Version or details of the consensus protocol in use. */
    consensus_version?: string;
    /** Additional chain-specific consensus data. */
    consensus?: any;
}
export interface InternalStateColumn {
    /** Name of the database column. */
    name: string;
    /** Version or schema version of the column. */
    version: number;
    /** Number of rows stored in this column. */
    rows: number;
    /** Total size (in bytes) of keys stored in this column. */
    keyBytes: number;
    /** Total size (in bytes) of values stored in this column. */
    valueBytes: number;
    /** Timestamp of the last update to this column. */
    updated: string;
}
export interface BlockbookInfo {
    /** Coin name, e.g. 'Bitcoin'. */
    coin: string;
    /** Network shortcut, e.g. 'BTC'. */
    network: string;
    /** Hostname of the blockbook instance, e.g. 'backend5'. */
    host: string;
    /** Running blockbook version, e.g. '0.4.0'. */
    version: string;
    /** Git commit hash of the running blockbook, e.g. 'a0960c8e'. */
    gitCommit: string;
    /** Build time of running blockbook, e.g. '2024-08-08T12:32:50+00:00'. */
    buildTime: string;
    /** If true, blockbook is syncing from scratch or in a special sync mode. */
    syncMode: boolean;
    /** Indicates if blockbook is in its initial sync phase. */
    initialSync: boolean;
    /** Indicates if the backend is fully synced with the blockchain. */
    inSync: boolean;
    /** Best (latest) block height according to this instance. */
    bestHeight: number;
    /** Timestamp of the latest block in the chain. */
    lastBlockTime: string;
    /** Indicates if mempool info is synced as well. */
    inSyncMempool: boolean;
    /** Timestamp of the last mempool update. */
    lastMempoolTime: string;
    /** Number of unconfirmed transactions in the mempool. */
    mempoolSize: number;
    /** Number of decimals for this coin's base unit. */
    decimals: number;
    /** Size of the underlying database in bytes. */
    dbSize: number;
    /** Whether this instance provides fiat exchange rates. */
    hasFiatRates?: boolean;
    /** Whether this instance provides fiat exchange rates for tokens. */
    hasTokenFiatRates?: boolean;
    /** Timestamp of the latest fiat rates update. */
    currentFiatRatesTime?: string;
    /** Timestamp of the latest historical fiat rates update. */
    historicalFiatRatesTime?: string;
    /** Timestamp of the latest historical token fiat rates update. */
    historicalTokenFiatRatesTime?: string;
    /** List of contract addresses supported for staking. */
    supportedStakingPools?: string[];
    /** Optional calculated DB size from columns. */
    dbSizeFromColumns?: number;
    /** List of columns/tables in the DB for internal state. */
    dbColumns?: InternalStateColumn[];
    /** Additional human-readable info about this blockbook instance. */
    about: string;
}
export interface SystemInfo {
    /** Blockbook instance information. */
    blockbook: BlockbookInfo;
    /** Information about the connected backend node. */
    backend: BackendInfo;
}
export interface FiatTicker {
    /** Unix timestamp for these fiat rates. */
    ts?: number;
    /** Map of currency codes to their exchange rate. */
    rates: { [key: string]: number };
    /** Any error message encountered while fetching rates. */
    error?: string;
}
export interface FiatTickers {
    /** List of fiat tickers with timestamps and rates. */
    tickers: FiatTicker[];
}
export interface AvailableVsCurrencies {
    /** Timestamp for the available currency list. */
    ts?: number;
    /** List of currency codes (e.g., USD, EUR) supported by the rates. */
    available_currencies: string[];
    /** Error message, if any, when fetching the available currencies. */
    error?: string;
}
export interface WsReq {
    /** Unique request identifier. */
    id: string;
    /** Requested method name. */
    method:
        | 'getAccountInfo'
        | 'getInfo'
        | 'getBlockHash'
        | 'getBlock'
        | 'getAccountUtxo'
        | 'getBalanceHistory'
        | 'getTransaction'
        | 'getTransactionSpecific'
        | 'estimateFee'
        | 'sendTransaction'
        | 'subscribeNewBlock'
        | 'unsubscribeNewBlock'
        | 'subscribeNewTransaction'
        | 'unsubscribeNewTransaction'
        | 'subscribeAddresses'
        | 'unsubscribeAddresses'
        | 'subscribeFiatRates'
        | 'unsubscribeFiatRates'
        | 'ping'
        | 'getCurrentFiatRates'
        | 'getFiatRatesForTimestamps'
        | 'getFiatRatesTickersList'
        | 'getMempoolFilters';
    /** Parameters for the requested method in raw JSON format. */
    params: any;
}
export interface WsRes {
    /** Corresponding request identifier. */
    id: string;
    /** Payload of the response, structure depends on the request. */
    data: any;
}
export interface WsAccountInfoReq {
    /** Address or XPUB descriptor to query. */
    descriptor: string;
    /** Level of detail to retrieve about the account. */
    details?: 'basic' | 'tokens' | 'tokenBalances' | 'txids' | 'txslight' | 'txs';
    /** Which tokens to include in the account info. */
    tokens?: 'derived' | 'used' | 'nonzero';
    /** Number of items per page, if paging is used. */
    pageSize?: number;
    /** Requested page index, if paging is used. */
    page?: number;
    /** Starting block height for transaction filtering. */
    from?: number;
    /** Ending block height for transaction filtering. */
    to?: number;
    /** Filter by specific contract address (for token data). */
    contractFilter?: string;
    /** Currency code to convert values into (e.g. 'USD'). */
    secondaryCurrency?: string;
    /** Gap limit for XPUB scanning, if relevant. */
    gap?: number;
}
export interface WsBackendInfo {
    /** Backend version string. */
    version?: string;
    /** Backend sub-version string. */
    subversion?: string;
    /** Consensus protocol version in use. */
    consensus_version?: string;
    /** Additional consensus details, structure depends on blockchain. */
    consensus?: any;
}
export interface WsInfoRes {
    /** Human-readable blockchain name. */
    name: string;
    /** Short code for the blockchain (e.g. BTC, ETH). */
    shortcut: string;
    /** Network identifier (e.g. mainnet, testnet). */
    network: string;
    /** Number of decimals in the base unit of the coin. */
    decimals: number;
    /** Version of the blockbook or backend service. */
    version: string;
    /** Current best chain height according to the backend. */
    bestHeight: number;
    /** Block hash of the best (latest) block. */
    bestHash: string;
    /** Genesis block hash or identifier. */
    block0Hash: string;
    /** Indicates if this is a test network. */
    testnet: boolean;
    /** Additional backend-related information. */
    backend: WsBackendInfo;
}
export interface WsBlockHashReq {
    /** Block height for which the hash is requested. */
    height: number;
}
export interface WsBlockHashRes {
    /** Block hash at the requested height. */
    hash: string;
}
export interface WsBlockReq {
    /** Block identifier (hash). */
    id: string;
    /** Number of transactions per page in the block. */
    pageSize?: number;
    /** Page index to retrieve if multiple pages of transactions are available. */
    page?: number;
}
export interface WsBlockFilterReq {
    /** Type of script filter (e.g., P2PKH, P2SH). */
    scriptType: string;
    /** Block hash for which we want the filter. */
    blockHash: string;
    /** Optional parameter for certain filter logic. */
    M?: number;
}
export interface WsBlockFiltersBatchReq {
    /** Type of script filter (e.g., P2PKH, P2SH). */
    scriptType: string;
    /** Hash of the latest known block. Filters will be retrieved backward from here. */
    bestKnownBlockHash: string;
    /** Number of block filters per request. */
    pageSize?: number;
    /** Optional parameter for certain filter logic. */
    M?: number;
}
export interface WsAccountUtxoReq {
    /** Address or XPUB descriptor to retrieve UTXOs for. */
    descriptor: string;
}
export interface WsBalanceHistoryReq {
    /** Address or XPUB descriptor to query history for. */
    descriptor: string;
    /** Unix timestamp from which to start the history. */
    from?: number;
    /** Unix timestamp at which to end the history. */
    to?: number;
    /** List of currency codes for which to fetch exchange rates at each interval. */
    currencies?: string[];
    /** Gap limit for XPUB scanning, if relevant. */
    gap?: number;
    /** Size of each aggregated time window in seconds. */
    groupBy?: number;
}
export interface WsTransactionReq {
    /** Transaction ID to retrieve details for. */
    txid: string;
}
export interface WsTransactionSpecificReq {
    /** Transaction ID for the detailed blockchain-specific data. */
    txid: string;
}
export interface WsEstimateFeeReq {
    /** Block confirmations targets for which fees should be estimated. */
    blocks?: number[];
    /** Additional chain-specific parameters (e.g. for Ethereum). */
    specific?: {
        conservative?: boolean;
        txsize?: number;
        from?: string;
        to?: string;
        data?: string;
        value?: string;
    };
}
export interface Eip1559Fee {
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
    minWaitTimeEstimate?: number;
    maxWaitTimeEstimate?: number;
}
export interface Eip1559Fees {
    baseFeePerGas?: string;
    low?: Eip1559Fee;
    medium?: Eip1559Fee;
    high?: Eip1559Fee;
    instant?: Eip1559Fee;
    networkCongestion?: number;
    latestPriorityFeeRange?: string[];
    historicalPriorityFeeRange?: string[];
    historicalBaseFeeRange?: string[];
    priorityFeeTrend?: 'up' | 'down';
    baseFeeTrend?: 'up' | 'down';
}
export interface WsEstimateFeeRes {
    /** Estimated total fee per transaction, if relevant. */
    feePerTx?: string;
    /** Estimated fee per unit (sat/byte, Wei/gas, etc.). */
    feePerUnit?: string;
    /** Max fee limit for blockchains like Ethereum. */
    feeLimit?: string;
    eip1559?: Eip1559Fees;
}
export interface WsLongTermFeeRateRes {
    /** Long term fee rate (in sat/kByte). */
    feePerUnit: string;
    /** Amount of blocks used for the long term fee rate estimation. */
    blocks: number;
}
export interface WsSendTransactionReq {
    /** Hex-encoded transaction data to broadcast. */
    hex: string;
}
export interface WsSubscribeAddressesReq {
    /** List of addresses to subscribe for updates (e.g., new transactions). */
    addresses: string[];
}
export interface WsSubscribeFiatRatesReq {
    /** Fiat currency code (e.g. 'USD'). */
    currency?: string;
    /** List of token symbols or IDs to get fiat rates for. */
    tokens?: string[];
}
export interface WsCurrentFiatRatesReq {
    /** List of fiat currencies, e.g. ['USD','EUR']. */
    currencies?: string[];
    /** Token symbol or ID if asking for token fiat rates (e.g. 'ETH'). */
    token?: string;
}
export interface WsFiatRatesForTimestampsReq {
    /** List of Unix timestamps for which to retrieve fiat rates. */
    timestamps: number[];
    /** List of fiat currencies, e.g. ['USD','EUR']. */
    currencies?: string[];
    /** Token symbol or ID if asking for token fiat rates. */
    token?: string;
}
export interface WsFiatRatesTickersListReq {
    /** Timestamp for which the list of available tickers is needed. */
    timestamp?: number;
    /** Token symbol or ID if asking for token-specific fiat rates. */
    token?: string;
}
export interface WsMempoolFiltersReq {
    /** Type of script we are filtering for (e.g., P2PKH, P2SH). */
    scriptType: string;
    /** Only retrieve filters for mempool txs after this timestamp. */
    fromTimestamp: number;
    /** Optional parameter for certain filter logic (e.g., n-bloom). */
    M?: number;
}
export interface WsRpcCallReq {
    /** Address from which the RPC call is originated (if relevant). */
    from?: string;
    /** Contract or address to which the RPC call is made. */
    to: string;
    /** Hex-encoded call data (function signature + parameters). */
    data: string;
}
export interface WsRpcCallRes {
    /** Hex-encoded return data from the call. */
    data: string;
}
export interface MempoolTxidFilterEntries {
    /** Map of txid to filter data (hex-encoded). */
    entries?: { [key: string]: string };
    /** Indicates if a zeroed key was used in filter calculation. */
    usedZeroedKey?: boolean;
}
