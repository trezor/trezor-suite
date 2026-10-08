import type { RuntimeNetworkSource } from '@trezor/network-module-suite-common-types';
import { type NetworkSymbol, asNetworkSymbol } from '@trezor/network-module-types';

/** Who defined a runtime network: Trezor's signed list, or the user. */
export type RuntimeEvmNetworkSource = RuntimeNetworkSource;

/**
 * An EVM chain defined at runtime rather than built into the app. It is read and broadcast over
 * its own JSON-RPC nodes; the device signs for its chain ID like any other EVM chain.
 */
export type RuntimeEvmNetworkDefinition = {
    readonly symbol: NetworkSymbol;
    readonly chainId: number;
    readonly name: string;

    /** The coin's symbol shown to the user. */
    readonly nativeSymbol: string;
    readonly decimals: number;
    readonly rpcUrls: readonly string[];

    /** URL prefixes the transaction hash or address is appended to. */
    readonly explorer?: { readonly tx: string; readonly address: string };
    readonly testnet?: boolean;
    readonly source: RuntimeEvmNetworkSource;
};

export type RuntimeEvmNetworkDefinitionError =
    | 'invalid-shape'
    | 'invalid-symbol'
    | 'reserved-symbol'
    | 'invalid-chain-id'
    | 'reserved-chain-id'
    | 'unsupported-decimals'
    | 'invalid-rpc-url'
    | 'invalid-explorer-url';

export type ValidateRuntimeEvmNetworkDefinitionOptions = {
    source: RuntimeEvmNetworkSource;

    /** Symbols and chain IDs of the networks built into the app, which a runtime one may not reuse. */
    reservedSymbols: ReadonlySet<string>;
    reservedChainIds: ReadonlySet<number>;
};

export type RuntimeEvmNetworkDefinitionValidation =
    | { success: true; definition: RuntimeEvmNetworkDefinition }
    | { success: false; error: RuntimeEvmNetworkDefinitionError };

// Account keys join symbol, descriptor and device with '-', so a symbol must not contain one.
const SYMBOL_PATTERN = /^[a-z0-9]{2,10}$/;

// EVM transaction preparation and the device's display of unknown networks assume 18 decimals.
const SUPPORTED_DECIMALS = 18;

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
    typeof value === 'string' && value.trim().length > 0;

const isLocalHost = (hostname: string) => hostname === 'localhost' || hostname === '127.0.0.1';

/** An RPC node reached over TLS, or a node on this machine. */
export const isValidRuntimeRpcUrl = (value: unknown): value is string => {
    if (typeof value !== 'string') return false;
    try {
        const url = new URL(value);

        return url.protocol === 'https:' || (url.protocol === 'http:' && isLocalHost(url.hostname));
    } catch {
        return false;
    }
};

const isValidExplorerPrefix = (value: unknown): value is string => {
    if (typeof value !== 'string') return false;
    try {
        return new URL(value).protocol === 'https:';
    } catch {
        return false;
    }
};

const fail = (error: RuntimeEvmNetworkDefinitionError): RuntimeEvmNetworkDefinitionValidation => ({
    success: false,
    error,
});

/** Checks untrusted input (a remote list entry or the user's form) and makes a definition of it. */
export const validateRuntimeEvmNetworkDefinition = (
    input: unknown,
    { source, reservedSymbols, reservedChainIds }: ValidateRuntimeEvmNetworkDefinitionOptions,
): RuntimeEvmNetworkDefinitionValidation => {
    if (!isRecord(input)) return fail('invalid-shape');

    const { symbol, chainId, name, nativeSymbol, decimals, rpcUrls, explorer, testnet } = input;

    if (!isNonEmptyString(name) || !isNonEmptyString(nativeSymbol)) return fail('invalid-shape');
    if (typeof symbol !== 'string' || !SYMBOL_PATTERN.test(symbol)) return fail('invalid-symbol');
    if (reservedSymbols.has(symbol)) return fail('reserved-symbol');
    if (typeof chainId !== 'number' || !Number.isSafeInteger(chainId) || chainId <= 0) {
        return fail('invalid-chain-id');
    }
    if (reservedChainIds.has(chainId)) return fail('reserved-chain-id');
    if (decimals !== SUPPORTED_DECIMALS) return fail('unsupported-decimals');
    if (!Array.isArray(rpcUrls) || rpcUrls.length === 0 || !rpcUrls.every(isValidRuntimeRpcUrl)) {
        return fail('invalid-rpc-url');
    }
    if (
        explorer !== undefined &&
        (!isRecord(explorer) ||
            !isValidExplorerPrefix(explorer.tx) ||
            !isValidExplorerPrefix(explorer.address))
    ) {
        return fail('invalid-explorer-url');
    }
    if (testnet !== undefined && typeof testnet !== 'boolean') return fail('invalid-shape');

    return {
        success: true,
        definition: {
            symbol: asNetworkSymbol(symbol),
            chainId,
            name: name.trim(),
            nativeSymbol: nativeSymbol.trim(),
            decimals,
            rpcUrls: [...rpcUrls],
            ...(isRecord(explorer) && {
                explorer: { tx: String(explorer.tx), address: String(explorer.address) },
            }),
            ...(testnet !== undefined && { testnet }),
            source,
        },
    };
};
