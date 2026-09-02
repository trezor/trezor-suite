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

// Upper bound for reading the whole contract-token allow-list from the RPC.
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

    // SEP-41 `balance` returns an i128 -> scValToNative yields a bigint.
    return balance == null ? undefined : (balance as bigint).toString();
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
// contract, against a rate-limited public endpoint.
const metadataCache = new Map<string, Sep41Metadata>();

/**
 * Reads a token's SEP-41 metadata (`decimals`/`symbol`/`name`) from the contract.
 * Makes tokens self-describing, so callers need only supply contract addresses.
 */
export const getContractTokenMetadata = async (
    server: SorobanServer,
    contractId: string,
    networkPassphrase: string = Networks.PUBLIC,
): Promise<Sep41Metadata> => {
    const cacheKey = `${networkPassphrase}:${contractId}`;
    const cached = metadataCache.get(cacheKey);
    if (cached) return cached;

    const [decimals, symbol, name] = await Promise.all([
        simulateContractRead(server, contractId, 'decimals', [], networkPassphrase),
        simulateContractRead(server, contractId, 'symbol', [], networkPassphrase),
        simulateContractRead(server, contractId, 'name', [], networkPassphrase),
    ]);

    // `decimals` is a u32 -> number; be tolerant of a bigint too.
    const isNumeric = typeof decimals === 'number' || typeof decimals === 'bigint';

    const metadata: Sep41Metadata = {
        decimals: isNumeric ? Number(decimals) : undefined,
        symbol: typeof symbol === 'string' ? symbol : undefined,
        name: typeof name === 'string' ? name : undefined,
    };

    // A failed read says nothing about the contract, so only a real answer is kept.
    if (metadata.decimals != null) {
        metadataCache.set(cacheKey, metadata);
    }

    return metadata;
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

    const read = Promise.all(
        contractIds.map(contract =>
            getSep41Token(server, contract, holder, networkPassphrase).catch(() => undefined),
        ),
    );

    // A slow or unreachable RPC must never stall account loading, so cap the read
    // and fall back to no contract tokens if it does not finish in time.
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<(Sep41Token | undefined)[]>(resolve => {
        timeoutId = setTimeout(() => resolve([]), SEP41_READ_TIMEOUT_MS);
    });

    try {
        const tokens = await Promise.race([read, timeout]);

        return tokens.filter((token): token is Sep41Token => token != null);
    } finally {
        clearTimeout(timeoutId);
    }
};

/**
 * Reads SEP-41 balances for a fixed list of contract tokens held by `holder`.
 * Discovery is an explicit allow-list — there is no on-chain registry of an
 * account's contract-token holdings. Missing/failed reads resolve to `'0'`.
 */
export const getContractTokenBalances = (
    server: SorobanServer,
    holder: string,
    contractIds: string[],
    networkPassphrase: string = Networks.PUBLIC,
): Promise<{ contract: string; balance: string }[]> =>
    Promise.all(
        contractIds.map(async contract => {
            try {
                const balance = await getContractTokenBalance(
                    server,
                    contract,
                    holder,
                    networkPassphrase,
                );

                return { contract, balance: balance ?? '0' };
            } catch {
                return { contract, balance: '0' };
            }
        }),
    );

/** Convenience: create a server and read a fixed token list in one call. */
export const readStellarContractTokenBalances = (
    rpcUrl: string,
    holder: string,
    contractIds: string[],
    networkPassphrase: string = Networks.PUBLIC,
): Promise<{ contract: string; balance: string }[]> =>
    getContractTokenBalances(getSorobanServer(rpcUrl), holder, contractIds, networkPassphrase);
