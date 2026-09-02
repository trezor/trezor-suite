import {
    Account,
    Address,
    BASE_FEE,
    Contract,
    Networks,
    StrKey,
    TransactionBuilder,
    rpc,
    scValToNative,
    type xdr,
} from '@stellar/stellar-sdk';

import { resolveAfter } from '@trezor/utils';

/**
 * Soroban (Stellar) JSON-RPC helpers for reading SEP-41 contract-token balances.
 *
 * Contract tokens (`C…` addresses) live in Soroban contract storage and are
 * invisible to Horizon. Their balances are read from a Stellar RPC node over
 * JSON-RPC via a read-only `simulateTransaction` of the token's SEP-41
 * `balance(addr)` function: no signing, no fees, no ledger change — and it works
 * for any SEP-41-compliant token regardless of its storage layout.
 */

// A read-only simulation still needs a syntactically valid ed25519 (`G…`) source
// account, but its existence and sequence are irrelevant. Derive a deterministic
// all-zero placeholder rather than depend on a real funded account.
const SIMULATION_SOURCE_ACCOUNT = StrKey.encodeEd25519PublicKey(Buffer.alloc(32));

// Upper bound for reading one contract token from the RPC.
const SEP41_READ_TIMEOUT_MS = 10_000;

export type SorobanServer = rpc.Server;

export const getSorobanServer = (url: string): SorobanServer =>
    new rpc.Server(url, { allowHttp: url.startsWith('http://') });

const simulateContractRead = async (
    server: SorobanServer,
    contractId: string,
    method: string,
    args: xdr.ScVal[],
    networkPassphrase: string,
): Promise<unknown> => {
    const source = new Account(SIMULATION_SOURCE_ACCOUNT, '0');
    const transaction = new TransactionBuilder(source, {
        fee: BASE_FEE,
        networkPassphrase,
    })
        .addOperation(new Contract(contractId).call(method, ...args))
        .setTimeout(30)
        .build();

    const simulation = await server.simulateTransaction(transaction);

    if (rpc.Api.isSimulationError(simulation)) {
        // Contract is not a SEP-41 token, or the function panicked.
        return undefined;
    }

    const retval = simulation.result?.retval;

    return retval ? scValToNative(retval) : undefined;
};

/**
 * Reads a single SEP-41 `balance(holder)` from a contract token.
 * Returns the balance as a base-unit string, or `undefined` when it cannot be
 * read (not a token / no balance entry / RPC failure).
 */
export const getContractTokenBalance = async (
    server: SorobanServer,
    contractId: string,
    holder: string,
    networkPassphrase: string = Networks.PUBLIC,
): Promise<string | undefined> => {
    const balance = await simulateContractRead(
        server,
        contractId,
        'balance',
        [Address.fromString(holder).toScVal()],
        networkPassphrase,
    );

    // SEP-41 `balance` returns an i128 -> scValToNative yields a bigint. A watched contract can
    // be anything the user pasted, so a non-numeric return value must not become a balance.
    return typeof balance === 'bigint' || typeof balance === 'number'
        ? balance.toString()
        : undefined;
};

/** SEP-41 descriptive metadata, read from the token contract itself. */
export interface Sep41Metadata {
    decimals?: number;
    symbol?: string;
    name?: string;
}

// A token's decimals/symbol/name never change, while balances are re-read on every account
// refresh — so the descriptive half of the read is kept for the lifetime of the worker. Three of
// the four simulations per token would otherwise repeat on every refresh, for every watched
// contract, against a rate-limited public endpoint. The in-flight promise is cached rather than
// the value, so concurrent account refreshes share one read instead of stampeding the RPC.
const metadataCache = new Map<string, Promise<Sep41Metadata>>();

const readContractTokenMetadata = async (
    server: SorobanServer,
    contractId: string,
    networkPassphrase: string,
): Promise<Sep41Metadata> => {
    const [decimals, symbol, name] = await Promise.all([
        simulateContractRead(server, contractId, 'decimals', [], networkPassphrase),
        simulateContractRead(server, contractId, 'symbol', [], networkPassphrase),
        simulateContractRead(server, contractId, 'name', [], networkPassphrase),
    ]);

    // `decimals` is a u32 -> number; be tolerant of a bigint too.
    const isNumeric = typeof decimals === 'number' || typeof decimals === 'bigint';

    return {
        decimals: isNumeric ? Number(decimals) : undefined,
        symbol: typeof symbol === 'string' ? symbol : undefined,
        name: typeof name === 'string' ? name : undefined,
    };
};

/**
 * Reads a token's SEP-41 metadata (`decimals`/`symbol`/`name`) from the contract.
 * Makes tokens self-describing, so callers need only supply contract addresses.
 */
export const getContractTokenMetadata = (
    server: SorobanServer,
    contractId: string,
    networkPassphrase: string = Networks.PUBLIC,
): Promise<Sep41Metadata> => {
    const cacheKey = `${networkPassphrase}:${contractId}`;
    const cached = metadataCache.get(cacheKey);
    if (cached) return cached;

    const pending = readContractTokenMetadata(server, contractId, networkPassphrase).then(
        metadata => {
            // A failed read says nothing about the contract, so only a real answer is kept.
            if (metadata.decimals == null) {
                metadataCache.delete(cacheKey);
            }

            return metadata;
        },
        error => {
            metadataCache.delete(cacheKey);
            throw error;
        },
    );

    metadataCache.set(cacheKey, pending);

    return pending;
};

/** A fully-described SEP-41 token holding for an account. */
export interface Sep41Token extends Sep41Metadata {
    contract: string;
    balance: string;
}

/**
 * Reads a contract's full SEP-41 data (balance + metadata) for `holder`.
 * Returns `undefined` when the contract does not behave like a SEP-41 token
 * (neither a balance nor `decimals` could be read).
 */
export const getSep41Token = async (
    server: SorobanServer,
    contractId: string,
    holder: string,
    networkPassphrase: string = Networks.PUBLIC,
): Promise<Sep41Token | undefined> => {
    const [balance, metadata] = await Promise.all([
        getContractTokenBalance(server, contractId, holder, networkPassphrase),
        getContractTokenMetadata(server, contractId, networkPassphrase),
    ]);

    if (balance == null && metadata.decimals == null) {
        return undefined;
    }

    return { contract: contractId, balance: balance ?? '0', ...metadata };
};

/**
 * Reads full SEP-41 token data for a fixed allow-list of contracts held by
 * `holder`. Self-describing (metadata comes from each contract). There is no
 * on-chain registry of contract-token holdings, so discovery is an explicit
 * allow-list rather than auto-discovery. Failed reads are dropped.
 */
export const readSep41Tokens = async (
    rpcUrl: string,
    holder: string,
    contractIds: string[],
    networkPassphrase: string = Networks.PUBLIC,
): Promise<Sep41Token[]> => {
    const server = getSorobanServer(rpcUrl);

    // A slow or unreachable RPC must never stall account loading, so each read is capped and
    // falls back to no token. Capping per token keeps one slow contract from discarding the
    // tokens that did resolve in time.
    const tokens = await Promise.all(
        contractIds.map(contract =>
            Promise.race([
                getSep41Token(server, contract, holder, networkPassphrase).catch(() => undefined),
                resolveAfter<Sep41Token | undefined>(SEP41_READ_TIMEOUT_MS),
            ]),
        ),
    );

    return tokens.filter((token): token is Sep41Token => token != null);
};
