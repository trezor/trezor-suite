import {
    type RuntimeEvmNetworkDefinition,
    type RuntimeEvmNetworkDefinitionError,
    type ValidateRuntimeEvmNetworkDefinitionOptions,
    validateRuntimeEvmNetworkDefinition,
} from '@trezor/network-ethereum-suite-common';

/** What the user types to add an EVM network. */
export type RuntimeEvmNetworkInput = {
    name: string;
    chainId: string;
    symbol: string;
    nativeSymbol: string;
    rpcUrl: string;

    /** Base URL of a block explorer with the usual `/tx/` and `/address/` pages, or empty. */
    explorerUrl: string;
};

export type CheckRuntimeEvmNetworkInputDeps = Omit<
    ValidateRuntimeEvmNetworkDefinitionOptions,
    'source'
> & {
    /** The chain ID the node serves, or `null` when it cannot be reached. */
    getRpcChainId: (url: string) => Promise<number | null>;
};

export type RuntimeEvmNetworkInputCheck =
    | { success: true; definition: RuntimeEvmNetworkDefinition }
    | { success: false; message: string };

// Runtime EVM networks are a debug feature; its messages are not translated yet.
const ERROR_MESSAGES: Record<RuntimeEvmNetworkDefinitionError, string> = {
    'invalid-shape': 'Fill in the name and the coin symbol.',
    'invalid-symbol': 'The network symbol takes 2 to 10 lowercase letters or digits.',
    'reserved-symbol': 'Another network already uses this symbol.',
    'invalid-chain-id': 'The chain ID must be a positive whole number.',
    'reserved-chain-id': 'Another network already uses this chain ID.',
    'unsupported-decimals': 'Only coins with 18 decimals are supported.',
    'invalid-rpc-url': 'The RPC URL must use https (http only on this computer).',
    'invalid-explorer-url': 'The explorer URL must use https.',
};

const toExplorer = (explorerUrl: string) => {
    const base = explorerUrl.trim().replace(/\/+$/, '');

    return base ? { tx: `${base}/tx/`, address: `${base}/address/` } : undefined;
};

/**
 * Checks a network the user adds: the definition must be valid and free, and its node must serve
 * the chain it names, so a typo cannot point signing at another chain.
 */
export const checkRuntimeEvmNetworkInput = async (
    input: RuntimeEvmNetworkInput,
    { getRpcChainId, ...reservations }: CheckRuntimeEvmNetworkInputDeps,
): Promise<RuntimeEvmNetworkInputCheck> => {
    const rpcUrl = input.rpcUrl.trim();
    const validation = validateRuntimeEvmNetworkDefinition(
        {
            name: input.name,
            chainId: input.chainId.trim() === '' ? NaN : Number(input.chainId),
            symbol: input.symbol.trim().toLowerCase(),
            nativeSymbol: input.nativeSymbol,
            decimals: 18,
            rpcUrls: [rpcUrl],
            explorer: toExplorer(input.explorerUrl),
        },
        { ...reservations, source: 'user' },
    );

    if (!validation.success) {
        return { success: false, message: ERROR_MESSAGES[validation.error] };
    }

    const { definition } = validation;
    const servedChainId = await getRpcChainId(rpcUrl);

    if (servedChainId === null) {
        return {
            success: false,
            message: `The node at ${new URL(rpcUrl).host} cannot be reached.`,
        };
    }
    if (servedChainId !== definition.chainId) {
        return {
            success: false,
            message: `The node serves chain ${servedChainId}, not chain ${definition.chainId}.`,
        };
    }

    return { success: true, definition };
};
