import { Type, Static } from '@trezor/schema-utils';

export type APIError = Static<typeof APIError>;
export const APIError = Type.Object(
    {
        Text: Type.String(),
        Public: Type.Boolean(),
    },
    { $id: 'APIError' },
);

export type AddressAlias = Static<typeof AddressAlias>;
export const AddressAlias = Type.Object(
    {
        Type: Type.String(),
        Alias: Type.String(),
    },
    { $id: 'AddressAlias' },
);

export type EthereumInternalTransfer = Static<typeof EthereumInternalTransfer>;
export const EthereumInternalTransfer = Type.Object(
    {
        type: Type.Number(),
        from: Type.String(),
        to: Type.String(),
        value: Type.String(),
    },
    { $id: 'EthereumInternalTransfer' },
);

export type EthereumParsedInputParam = Static<typeof EthereumParsedInputParam>;
export const EthereumParsedInputParam = Type.Object(
    {
        type: Type.String(),
        values: Type.Optional(Type.Array(Type.String())),
    },
    { $id: 'EthereumParsedInputParam' },
);

export type EthereumParsedInputData = Static<typeof EthereumParsedInputData>;
export const EthereumParsedInputData = Type.Object(
    {
        methodId: Type.String(),
        name: Type.String(),
        function: Type.Optional(Type.String()),
        params: Type.Optional(Type.Array(EthereumParsedInputParam)),
    },
    { $id: 'EthereumParsedInputData' },
);

export type EthereumSpecific = Static<typeof EthereumSpecific>;
export const EthereumSpecific = Type.Object(
    {
        type: Type.Optional(Type.Number()),
        createdContract: Type.Optional(Type.String()),
        status: Type.Number(),
        error: Type.Optional(Type.String()),
        nonce: Type.Number(),
        gasLimit: Type.Number(),
        gasUsed: Type.Optional(Type.Number()),
        gasPrice: Type.Optional(Type.String()),
        l1Fee: Type.Optional(Type.Number()),
        l1FeeScalar: Type.Optional(Type.String()),
        l1GasPrice: Type.Optional(Type.String()),
        l1GasUsed: Type.Optional(Type.Number()),
        data: Type.Optional(Type.String()),
        parsedData: Type.Optional(EthereumParsedInputData),
        internalTransfers: Type.Optional(Type.Array(EthereumInternalTransfer)),
    },
    { $id: 'EthereumSpecific' },
);

export type MultiTokenValue = Static<typeof MultiTokenValue>;
export const MultiTokenValue = Type.Object(
    {
        id: Type.Optional(Type.String()),
        value: Type.Optional(Type.String()),
    },
    { $id: 'MultiTokenValue' },
);

export type TokenTransfer = Static<typeof TokenTransfer>;
export const TokenTransfer = Type.Object(
    {
        type: Type.String(),
        from: Type.String(),
        to: Type.String(),
        contract: Type.String(),
        name: Type.Optional(Type.String()),
        symbol: Type.Optional(Type.String()),
        decimals: Type.Number(),
        value: Type.Optional(Type.String()),
        multiTokenValues: Type.Optional(Type.Array(MultiTokenValue)),
    },
    { $id: 'TokenTransfer' },
);

export type Vout = Static<typeof Vout>;
export const Vout = Type.Object(
    {
        value: Type.Optional(Type.String()),
        n: Type.Number(),
        spent: Type.Optional(Type.Boolean()),
        spentTxId: Type.Optional(Type.String()),
        spentIndex: Type.Optional(Type.Number()),
        spentHeight: Type.Optional(Type.Number()),
        hex: Type.Optional(Type.String()),
        asm: Type.Optional(Type.String()),
        addresses: Type.Array(Type.String()),
        isAddress: Type.Boolean(),
        isOwn: Type.Optional(Type.Boolean()),
        type: Type.Optional(Type.String()),
    },
    { $id: 'Vout' },
);

export type Vin = Static<typeof Vin>;
export const Vin = Type.Object(
    {
        txid: Type.Optional(Type.String()),
        vout: Type.Optional(Type.Number()),
        sequence: Type.Optional(Type.Number()),
        n: Type.Number(),
        addresses: Type.Optional(Type.Array(Type.String())),
        isAddress: Type.Boolean(),
        isOwn: Type.Optional(Type.Boolean()),
        value: Type.Optional(Type.String()),
        hex: Type.Optional(Type.String()),
        asm: Type.Optional(Type.String()),
        coinbase: Type.Optional(Type.String()),
    },
    { $id: 'Vin' },
);

export type Tx = Static<typeof Tx>;
export const Tx = Type.Object(
    {
        txid: Type.String(),
        version: Type.Optional(Type.Number()),
        lockTime: Type.Optional(Type.Number()),
        vin: Type.Array(Vin),
        vout: Type.Array(Vout),
        blockHash: Type.Optional(Type.String()),
        blockHeight: Type.Number(),
        confirmations: Type.Number(),
        confirmationETABlocks: Type.Optional(Type.Number()),
        confirmationETASeconds: Type.Optional(Type.Number()),
        blockTime: Type.Number(),
        size: Type.Optional(Type.Number()),
        vsize: Type.Optional(Type.Number()),
        value: Type.String(),
        valueIn: Type.Optional(Type.String()),
        fees: Type.Optional(Type.String()),
        hex: Type.Optional(Type.String()),
        rbf: Type.Optional(Type.Boolean()),
        coinSpecificData: Type.Optional(Type.Any()),
        tokenTransfers: Type.Optional(Type.Array(TokenTransfer)),
        ethereumSpecific: Type.Optional(EthereumSpecific),
        addressAliases: Type.Optional(
            Type.Object(
                {},
                {
                    additionalProperties: AddressAlias,
                },
            ),
        ),
    },
    { $id: 'Tx' },
);

export type FeeStats = Static<typeof FeeStats>;
export const FeeStats = Type.Object(
    {
        txCount: Type.Number(),
        totalFeesSat: Type.String(),
        averageFeePerKb: Type.Number(),
        decilesFeePerKb: Type.Array(Type.Number()),
    },
    { $id: 'FeeStats' },
);

export type StakingPool = Static<typeof StakingPool>;
export const StakingPool = Type.Object(
    {
        contract: Type.String(),
        name: Type.String(),
        pendingBalance: Type.String(),
        pendingDepositedBalance: Type.String(),
        depositedBalance: Type.String(),
        withdrawTotalAmount: Type.String(),
        claimableAmount: Type.String(),
        restakedReward: Type.String(),
        autocompoundBalance: Type.String(),
    },
    { $id: 'StakingPool' },
);

export type ContractInfo = Static<typeof ContractInfo>;
export const ContractInfo = Type.Object(
    {
        type: Type.String(),
        contract: Type.String(),
        name: Type.String(),
        symbol: Type.String(),
        decimals: Type.Number(),
        createdInBlock: Type.Optional(Type.Number()),
        destructedInBlock: Type.Optional(Type.Number()),
    },
    { $id: 'ContractInfo' },
);

export type Token = Static<typeof Token>;
export const Token = Type.Object(
    {
        type: Type.Union([
            Type.Literal('XPUBAddress'),
            Type.Literal('ERC20'),
            Type.Literal('ERC721'),
            Type.Literal('ERC1155'),
            Type.Literal('BEP20'),
            Type.Literal('BEP721'),
            Type.Literal('BEP1155'),
        ]),
        name: Type.String(),
        path: Type.Optional(Type.String()),
        contract: Type.Optional(Type.String()),
        transfers: Type.Number(),
        symbol: Type.Optional(Type.String()),
        decimals: Type.Optional(Type.Number()),
        balance: Type.Optional(Type.String()),
        baseValue: Type.Optional(Type.Number()),
        secondaryValue: Type.Optional(Type.Number()),
        ids: Type.Optional(Type.Array(Type.String())),
        multiTokenValues: Type.Optional(Type.Array(MultiTokenValue)),
        totalReceived: Type.Optional(Type.String()),
        totalSent: Type.Optional(Type.String()),
    },
    { $id: 'Token' },
);

export type Address = Static<typeof Address>;
export const Address = Type.Object(
    {
        page: Type.Optional(Type.Number()),
        totalPages: Type.Optional(Type.Number()),
        itemsOnPage: Type.Optional(Type.Number()),
        address: Type.String(),
        balance: Type.String(),
        totalReceived: Type.Optional(Type.String()),
        totalSent: Type.Optional(Type.String()),
        unconfirmedBalance: Type.String(),
        unconfirmedTxs: Type.Number(),
        txs: Type.Number(),
        addrTxCount: Type.Optional(Type.Number()),
        nonTokenTxs: Type.Optional(Type.Number()),
        internalTxs: Type.Optional(Type.Number()),
        transactions: Type.Optional(Type.Array(Tx)),
        txids: Type.Optional(Type.Array(Type.String())),
        nonce: Type.Optional(Type.String()),
        usedTokens: Type.Optional(Type.Number()),
        tokens: Type.Optional(Type.Array(Token)),
        secondaryValue: Type.Optional(Type.Number()),
        tokensBaseValue: Type.Optional(Type.Number()),
        tokensSecondaryValue: Type.Optional(Type.Number()),
        totalBaseValue: Type.Optional(Type.Number()),
        totalSecondaryValue: Type.Optional(Type.Number()),
        contractInfo: Type.Optional(ContractInfo),
        erc20Contract: Type.Optional(ContractInfo),
        addressAliases: Type.Optional(
            Type.Object(
                {},
                {
                    additionalProperties: AddressAlias,
                },
            ),
        ),
        stakingPools: Type.Optional(Type.Array(StakingPool)),
    },
    { $id: 'Address' },
);

export type Utxo = Static<typeof Utxo>;
export const Utxo = Type.Object(
    {
        txid: Type.String(),
        vout: Type.Number(),
        value: Type.String(),
        height: Type.Optional(Type.Number()),
        confirmations: Type.Number(),
        address: Type.Optional(Type.String()),
        path: Type.Optional(Type.String()),
        lockTime: Type.Optional(Type.Number()),
        coinbase: Type.Optional(Type.Boolean()),
    },
    { $id: 'Utxo' },
);

export type BalanceHistory = Static<typeof BalanceHistory>;
export const BalanceHistory = Type.Object(
    {
        time: Type.Number(),
        txs: Type.Number(),
        received: Type.String(),
        sent: Type.String(),
        sentToSelf: Type.String(),
        rates: Type.Optional(
            Type.Object(
                {},
                {
                    additionalProperties: Type.Number(),
                },
            ),
        ),
        txid: Type.Optional(Type.String()),
    },
    { $id: 'BalanceHistory' },
);

export type BlockInfo = Static<typeof BlockInfo>;
export const BlockInfo = Type.Object(
    {
        Hash: Type.String(),
        Time: Type.Number(),
        Txs: Type.Number(),
        Size: Type.Number(),
        Height: Type.Number(),
    },
    { $id: 'BlockInfo' },
);

export type Blocks = Static<typeof Blocks>;
export const Blocks = Type.Object(
    {
        page: Type.Optional(Type.Number()),
        totalPages: Type.Optional(Type.Number()),
        itemsOnPage: Type.Optional(Type.Number()),
        blocks: Type.Array(BlockInfo),
    },
    { $id: 'Blocks' },
);

export type Block = Static<typeof Block>;
export const Block = Type.Object(
    {
        page: Type.Optional(Type.Number()),
        totalPages: Type.Optional(Type.Number()),
        itemsOnPage: Type.Optional(Type.Number()),
        hash: Type.String(),
        previousBlockHash: Type.Optional(Type.String()),
        nextBlockHash: Type.Optional(Type.String()),
        height: Type.Number(),
        confirmations: Type.Number(),
        size: Type.Number(),
        time: Type.Optional(Type.Number()),
        version: Type.String(),
        merkleRoot: Type.String(),
        nonce: Type.String(),
        bits: Type.String(),
        difficulty: Type.String(),
        tx: Type.Optional(Type.Array(Type.String())),
        txCount: Type.Number(),
        txs: Type.Optional(Type.Array(Tx)),
        addressAliases: Type.Optional(
            Type.Object(
                {},
                {
                    additionalProperties: AddressAlias,
                },
            ),
        ),
    },
    { $id: 'Block' },
);

export type BlockRaw = Static<typeof BlockRaw>;
export const BlockRaw = Type.Object(
    {
        hex: Type.String(),
    },
    { $id: 'BlockRaw' },
);

export type BackendInfo = Static<typeof BackendInfo>;
export const BackendInfo = Type.Object(
    {
        error: Type.Optional(Type.String()),
        chain: Type.Optional(Type.String()),
        blocks: Type.Optional(Type.Number()),
        headers: Type.Optional(Type.Number()),
        bestBlockHash: Type.Optional(Type.String()),
        difficulty: Type.Optional(Type.String()),
        sizeOnDisk: Type.Optional(Type.Number()),
        version: Type.Optional(Type.String()),
        subversion: Type.Optional(Type.String()),
        protocolVersion: Type.Optional(Type.String()),
        timeOffset: Type.Optional(Type.Number()),
        warnings: Type.Optional(Type.String()),
        consensus_version: Type.Optional(Type.String()),
        consensus: Type.Optional(Type.Any()),
    },
    { $id: 'BackendInfo' },
);

export type InternalStateColumn = Static<typeof InternalStateColumn>;
export const InternalStateColumn = Type.Object(
    {
        name: Type.String(),
        version: Type.Number(),
        rows: Type.Number(),
        keyBytes: Type.Number(),
        valueBytes: Type.Number(),
        updated: Type.String(),
    },
    { $id: 'InternalStateColumn' },
);

export type BlockbookInfo = Static<typeof BlockbookInfo>;
export const BlockbookInfo = Type.Object(
    {
        coin: Type.String(),
        network: Type.String(),
        host: Type.String(),
        version: Type.String(),
        gitCommit: Type.String(),
        buildTime: Type.String(),
        syncMode: Type.Boolean(),
        initialSync: Type.Boolean(),
        inSync: Type.Boolean(),
        bestHeight: Type.Number(),
        lastBlockTime: Type.String(),
        inSyncMempool: Type.Boolean(),
        lastMempoolTime: Type.String(),
        mempoolSize: Type.Number(),
        decimals: Type.Number(),
        dbSize: Type.Number(),
        hasFiatRates: Type.Optional(Type.Boolean()),
        hasTokenFiatRates: Type.Optional(Type.Boolean()),
        currentFiatRatesTime: Type.Optional(Type.String()),
        historicalFiatRatesTime: Type.Optional(Type.String()),
        historicalTokenFiatRatesTime: Type.Optional(Type.String()),
        supportedStakingPools: Type.Optional(Type.Array(Type.String())),
        dbSizeFromColumns: Type.Optional(Type.Number()),
        dbColumns: Type.Optional(Type.Array(InternalStateColumn)),
        about: Type.String(),
    },
    { $id: 'BlockbookInfo' },
);

export type SystemInfo = Static<typeof SystemInfo>;
export const SystemInfo = Type.Object(
    {
        blockbook: BlockbookInfo,
        backend: BackendInfo,
    },
    { $id: 'SystemInfo' },
);

export type FiatTicker = Static<typeof FiatTicker>;
export const FiatTicker = Type.Object(
    {
        ts: Type.Optional(Type.Number()),
        rates: Type.Object(
            {},
            {
                additionalProperties: Type.Number(),
            },
        ),
        error: Type.Optional(Type.String()),
    },
    { $id: 'FiatTicker' },
);

export type FiatTickers = Static<typeof FiatTickers>;
export const FiatTickers = Type.Object(
    {
        tickers: Type.Array(FiatTicker),
    },
    { $id: 'FiatTickers' },
);

export type AvailableVsCurrencies = Static<typeof AvailableVsCurrencies>;
export const AvailableVsCurrencies = Type.Object(
    {
        ts: Type.Optional(Type.Number()),
        available_currencies: Type.Array(Type.String()),
        error: Type.Optional(Type.String()),
    },
    { $id: 'AvailableVsCurrencies' },
);

export type WsReq = Static<typeof WsReq>;
export const WsReq = Type.Object(
    {
        id: Type.String(),
        method: Type.Union([
            Type.Literal('getAccountInfo'),
            Type.Literal('getInfo'),
            Type.Literal('getBlockHash'),
            Type.Literal('getBlock'),
            Type.Literal('getAccountUtxo'),
            Type.Literal('getBalanceHistory'),
            Type.Literal('getTransaction'),
            Type.Literal('getTransactionSpecific'),
            Type.Literal('estimateFee'),
            Type.Literal('sendTransaction'),
            Type.Literal('subscribeNewBlock'),
            Type.Literal('unsubscribeNewBlock'),
            Type.Literal('subscribeNewTransaction'),
            Type.Literal('unsubscribeNewTransaction'),
            Type.Literal('subscribeAddresses'),
            Type.Literal('unsubscribeAddresses'),
            Type.Literal('subscribeFiatRates'),
            Type.Literal('unsubscribeFiatRates'),
            Type.Literal('ping'),
            Type.Literal('getCurrentFiatRates'),
            Type.Literal('getFiatRatesForTimestamps'),
            Type.Literal('getFiatRatesTickersList'),
            Type.Literal('getMempoolFilters'),
        ]),
        params: Type.Any(),
    },
    { $id: 'WsReq' },
);

export type WsRes = Static<typeof WsRes>;
export const WsRes = Type.Object(
    {
        id: Type.String(),
        data: Type.Any(),
    },
    { $id: 'WsRes' },
);

export type WsAccountInfoReq = Static<typeof WsAccountInfoReq>;
export const WsAccountInfoReq = Type.Object(
    {
        descriptor: Type.String(),
        details: Type.Optional(
            Type.Union([
                Type.Literal('basic'),
                Type.Literal('tokens'),
                Type.Literal('tokenBalances'),
                Type.Literal('txids'),
                Type.Literal('txslight'),
                Type.Literal('txs'),
            ]),
        ),
        tokens: Type.Optional(
            Type.Union([Type.Literal('derived'), Type.Literal('used'), Type.Literal('nonzero')]),
        ),
        pageSize: Type.Optional(Type.Number()),
        page: Type.Optional(Type.Number()),
        from: Type.Optional(Type.Number()),
        to: Type.Optional(Type.Number()),
        contractFilter: Type.Optional(Type.String()),
        secondaryCurrency: Type.Optional(Type.String()),
        gap: Type.Optional(Type.Number()),
    },
    { $id: 'WsAccountInfoReq' },
);

export type WsBackendInfo = Static<typeof WsBackendInfo>;
export const WsBackendInfo = Type.Object(
    {
        version: Type.Optional(Type.String()),
        subversion: Type.Optional(Type.String()),
        consensus_version: Type.Optional(Type.String()),
        consensus: Type.Optional(Type.Any()),
    },
    { $id: 'WsBackendInfo' },
);

export type WsInfoRes = Static<typeof WsInfoRes>;
export const WsInfoRes = Type.Object(
    {
        name: Type.String(),
        shortcut: Type.String(),
        network: Type.String(),
        decimals: Type.Number(),
        version: Type.String(),
        bestHeight: Type.Number(),
        bestHash: Type.String(),
        block0Hash: Type.String(),
        testnet: Type.Boolean(),
        backend: WsBackendInfo,
    },
    { $id: 'WsInfoRes' },
);

export type WsBlockHashReq = Static<typeof WsBlockHashReq>;
export const WsBlockHashReq = Type.Object(
    {
        height: Type.Number(),
    },
    { $id: 'WsBlockHashReq' },
);

export type WsBlockHashRes = Static<typeof WsBlockHashRes>;
export const WsBlockHashRes = Type.Object(
    {
        hash: Type.String(),
    },
    { $id: 'WsBlockHashRes' },
);

export type WsBlockReq = Static<typeof WsBlockReq>;
export const WsBlockReq = Type.Object(
    {
        id: Type.String(),
        pageSize: Type.Optional(Type.Number()),
        page: Type.Optional(Type.Number()),
    },
    { $id: 'WsBlockReq' },
);

export type WsBlockFilterReq = Static<typeof WsBlockFilterReq>;
export const WsBlockFilterReq = Type.Object(
    {
        scriptType: Type.String(),
        blockHash: Type.String(),
        M: Type.Optional(Type.Number()),
    },
    { $id: 'WsBlockFilterReq' },
);

export type WsBlockFiltersBatchReq = Static<typeof WsBlockFiltersBatchReq>;
export const WsBlockFiltersBatchReq = Type.Object(
    {
        scriptType: Type.String(),
        bestKnownBlockHash: Type.String(),
        pageSize: Type.Optional(Type.Number()),
        M: Type.Optional(Type.Number()),
    },
    { $id: 'WsBlockFiltersBatchReq' },
);

export type WsAccountUtxoReq = Static<typeof WsAccountUtxoReq>;
export const WsAccountUtxoReq = Type.Object(
    {
        descriptor: Type.String(),
    },
    { $id: 'WsAccountUtxoReq' },
);

export type WsBalanceHistoryReq = Static<typeof WsBalanceHistoryReq>;
export const WsBalanceHistoryReq = Type.Object(
    {
        descriptor: Type.String(),
        from: Type.Optional(Type.Number()),
        to: Type.Optional(Type.Number()),
        currencies: Type.Optional(Type.Array(Type.String())),
        gap: Type.Optional(Type.Number()),
        groupBy: Type.Optional(Type.Number()),
    },
    { $id: 'WsBalanceHistoryReq' },
);

export type WsTransactionReq = Static<typeof WsTransactionReq>;
export const WsTransactionReq = Type.Object(
    {
        txid: Type.String(),
    },
    { $id: 'WsTransactionReq' },
);

export type WsTransactionSpecificReq = Static<typeof WsTransactionSpecificReq>;
export const WsTransactionSpecificReq = Type.Object(
    {
        txid: Type.String(),
    },
    { $id: 'WsTransactionSpecificReq' },
);

export type WsEstimateFeeReq = Static<typeof WsEstimateFeeReq>;
export const WsEstimateFeeReq = Type.Object(
    {
        blocks: Type.Optional(Type.Array(Type.Number())),
        specific: Type.Optional(
            Type.Object({
                conservative: Type.Optional(Type.Boolean()),
                txsize: Type.Optional(Type.Number()),
                from: Type.Optional(Type.String()),
                to: Type.Optional(Type.String()),
                data: Type.Optional(Type.String()),
                value: Type.Optional(Type.String()),
            }),
        ),
    },
    { $id: 'WsEstimateFeeReq' },
);

export type WsEstimateFeeRes = Static<typeof WsEstimateFeeRes>;
export const WsEstimateFeeRes = Type.Object(
    {
        feePerTx: Type.Optional(Type.String()),
        feePerUnit: Type.Optional(Type.String()),
        feeLimit: Type.Optional(Type.String()),
    },
    { $id: 'WsEstimateFeeRes' },
);

export type WsSendTransactionReq = Static<typeof WsSendTransactionReq>;
export const WsSendTransactionReq = Type.Object(
    {
        hex: Type.String(),
    },
    { $id: 'WsSendTransactionReq' },
);

export type WsSubscribeAddressesReq = Static<typeof WsSubscribeAddressesReq>;
export const WsSubscribeAddressesReq = Type.Object(
    {
        addresses: Type.Array(Type.String()),
    },
    { $id: 'WsSubscribeAddressesReq' },
);

export type WsSubscribeFiatRatesReq = Static<typeof WsSubscribeFiatRatesReq>;
export const WsSubscribeFiatRatesReq = Type.Object(
    {
        currency: Type.Optional(Type.String()),
        tokens: Type.Optional(Type.Array(Type.String())),
    },
    { $id: 'WsSubscribeFiatRatesReq' },
);

export type WsCurrentFiatRatesReq = Static<typeof WsCurrentFiatRatesReq>;
export const WsCurrentFiatRatesReq = Type.Object(
    {
        currencies: Type.Optional(Type.Array(Type.String())),
        token: Type.Optional(Type.String()),
    },
    { $id: 'WsCurrentFiatRatesReq' },
);

export type WsFiatRatesForTimestampsReq = Static<typeof WsFiatRatesForTimestampsReq>;
export const WsFiatRatesForTimestampsReq = Type.Object(
    {
        timestamps: Type.Array(Type.Number()),
        currencies: Type.Optional(Type.Array(Type.String())),
        token: Type.Optional(Type.String()),
    },
    { $id: 'WsFiatRatesForTimestampsReq' },
);

export type WsFiatRatesTickersListReq = Static<typeof WsFiatRatesTickersListReq>;
export const WsFiatRatesTickersListReq = Type.Object(
    {
        timestamp: Type.Optional(Type.Number()),
        token: Type.Optional(Type.String()),
    },
    { $id: 'WsFiatRatesTickersListReq' },
);

export type WsMempoolFiltersReq = Static<typeof WsMempoolFiltersReq>;
export const WsMempoolFiltersReq = Type.Object(
    {
        scriptType: Type.String(),
        fromTimestamp: Type.Number(),
        M: Type.Optional(Type.Number()),
    },
    { $id: 'WsMempoolFiltersReq' },
);

export type WsRpcCallReq = Static<typeof WsRpcCallReq>;
export const WsRpcCallReq = Type.Object(
    {
        from: Type.Optional(Type.String()),
        to: Type.String(),
        data: Type.String(),
    },
    { $id: 'WsRpcCallReq' },
);

export type WsRpcCallRes = Static<typeof WsRpcCallRes>;
export const WsRpcCallRes = Type.Object(
    {
        data: Type.String(),
    },
    { $id: 'WsRpcCallRes' },
);

export type MempoolTxidFilterEntries = Static<typeof MempoolTxidFilterEntries>;
export const MempoolTxidFilterEntries = Type.Object(
    {
        entries: Type.Optional(
            Type.Object(
                {},
                {
                    additionalProperties: Type.String(),
                },
            ),
        ),
        usedZeroedKey: Type.Optional(Type.Boolean()),
    },
    { $id: 'MempoolTxidFilterEntries' },
);
