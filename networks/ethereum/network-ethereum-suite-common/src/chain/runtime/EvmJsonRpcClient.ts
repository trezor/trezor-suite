/** EIP-1559 fees, or a legacy gas price on chains without them; in wei. */
export type EvmFeesPerGas =
    | { readonly maxFeePerGas: bigint; readonly maxPriorityFeePerGas: bigint }
    | { readonly gasPrice: bigint };

export type EvmGasEstimateRequest = {
    from: string;
    to: string;
    value: bigint;
    data: string;
};

/** The JSON-RPC calls an EVM chain network reads and broadcasts with. */
export type EvmJsonRpcClient = {
    getChainId: () => Promise<number>;
    getBlockNumber: () => Promise<bigint>;

    /** In wei. */
    getBalance: (address: string) => Promise<bigint>;
    getTransactionCount: (address: string, blockTag: 'latest' | 'pending') => Promise<number>;
    estimateGas: (request: EvmGasEstimateRequest) => Promise<bigint>;
    estimateFeesPerGas: () => Promise<EvmFeesPerGas>;

    /** Broadcasts a signed transaction; resolves its hash. */
    sendRawTransaction: (serializedTransaction: string) => Promise<string>;
};

/** Opens a client over the given nodes, trying the next one when a node fails. */
export type CreateEvmJsonRpcClient = (rpcUrls: readonly string[]) => EvmJsonRpcClient;
