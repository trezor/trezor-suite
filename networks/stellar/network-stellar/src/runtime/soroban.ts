import {
    Account,
    Address,
    BASE_FEE,
    Contract,
    Networks,
    StrKey,
    TransactionBuilder,
    nativeToScVal,
    rpc,
    scValToNative,
    xdr,
} from '@stellar/stellar-sdk';

import { isNotNullOrUndefined, resolveAfter } from '@trezor/utils';

/**
 * Soroban (Stellar) JSON-RPC helpers for reading SEP-41 contract-token balances.
 *
 * Contract tokens (`C…` addresses) live in Soroban contract storage and are invisible to
 * Horizon, so they are read from a Stellar RPC node over JSON-RPC. No signing, no fees, no
 * ledger change. The read has two tiers:
 *
 * 1. One `getLedgerEntries` call reads every contract at once, straight out of the ledger. It
 *    relies on the storage layout the reference token contracts share — balances under
 *    `Vec[Symbol("Balance"), Address]`, descriptive metadata under `METADATA` in instance
 *    storage — which SEP-41 does not mandate, so it is a fast path and not the contract.
 * 2. Anything the batch cannot answer falls back to a read-only `simulateTransaction` of the
 *    token's SEP-41 functions, which works for any compliant token whatever its storage layout.
 *
 * A ledger entry that is simply absent is ambiguous — an empty balance and a contract that keys
 * its balances differently look identical — so tier 1 never turns a miss into a zero; it defers
 * to tier 2, which asks the contract itself.
 */

// A read-only simulation still needs a syntactically valid ed25519 (`G…`) source
// account, but its existence and sequence are irrelevant. Derive a deterministic
// all-zero placeholder rather than depend on a real funded account.
const SIMULATION_SOURCE_ACCOUNT = StrKey.encodeEd25519PublicKey(Buffer.alloc(32));

// Upper bound for reading contract tokens from the RPC, batch and fallback together, so adding
// the batch in front of the simulations cannot push out account loading.
const SEP41_READ_TIMEOUT_MS = 10_000;

// The batch's slice of that budget. Whatever it leaves is what the fallback simulations get.
const SEP41_BATCH_TIMEOUT_MS = 4_000;

// `getLedgerEntries` accepts at most 200 keys per request.
// https://developers.stellar.org/docs/data/apis/rpc/api-reference/methods/getLedgerEntries
const MAX_LEDGER_KEYS_PER_REQUEST = 200;

// Where `soroban-token-sdk` keeps `TokenMetadata { decimal, name, symbol }`, in instance storage.
const SEP41_METADATA_STORAGE_KEY = 'METADATA';

/**
 * Resolves to `undefined` when `read` outruns `timeoutMs`.
 *
 * `Promise.race` settles but does not cancel, so the timer is aborted once the read answers —
 * otherwise every contract read would leave a pending timeout keeping the worker awake.
 */
const withTimeout = async <T>(read: Promise<T>, timeoutMs: number): Promise<T | undefined> => {
    const expiry = new AbortController();
    try {
        return await Promise.race([
            read,
            resolveAfter<T | undefined>(timeoutMs, expiry.signal).catch(() => undefined),
        ]);
    } finally {
        expiry.abort();
    }
};

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

const metadataCacheKey = (contractId: string, networkPassphrase: string) =>
    `${networkPassphrase}:${contractId}`;

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
    const cacheKey = metadataCacheKey(contractId, networkPassphrase);
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
 * Returns `undefined` when the balance could not be read — either the contract does not behave
 * like a SEP-41 token, or the read failed. An unread balance is not a zero balance, and
 * reporting it as one is indistinguishable from a holding the user really spent, so no token is
 * reported at all rather than a fabricated amount.
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

    if (balance == null) {
        return undefined;
    }

    return { contract: contractId, balance, ...metadata };
};

/**
 * The ledger keys a contract token is read from: its instance (which carries the descriptive
 * metadata) and the holder's balance entry.
 *
 * Both are the layout the reference implementations use — the Stellar Asset Contract and the
 * `soroban-examples` token — not something SEP-41 requires, so a contract is free not to match.
 */
const contractLedgerKeys = (contractId: string, holder: string, withInstance: boolean) => {
    const balance = xdr.LedgerKey.contractData(
        new xdr.LedgerKeyContractData({
            contract: Address.fromString(contractId).toScAddress(),
            durability: xdr.ContractDataDurability.persistent,
            key: nativeToScVal(['Balance', holder], { type: ['symbol', 'address'] }),
        }),
    );

    // `getFootprint()` is the contract's instance key.
    return withInstance ? [new Contract(contractId).getFootprint(), balance] : [balance];
};

/**
 * A Stellar Asset Contract wraps the balance in `{ amount, authorized, clawback }`; the
 * `soroban-examples` token stores a bare i128. Anything else is not a balance we can read.
 */
const readLedgerBalance = (value: unknown): string | undefined => {
    const amount =
        value !== null && typeof value === 'object' && 'amount' in value
            ? (value as { amount: unknown }).amount
            : value;

    return typeof amount === 'bigint' || typeof amount === 'number' ? amount.toString() : undefined;
};

const readLedgerMetadata = (instance: xdr.ScContractInstance): Sep41Metadata | undefined => {
    const stored = instance.storage?.find(
        entry => scValToNative(entry.key) === SEP41_METADATA_STORAGE_KEY,
    );
    if (!stored) return undefined;

    const metadata: unknown = scValToNative(stored.val);
    if (metadata == null || typeof metadata !== 'object') return undefined;

    // `soroban-token-sdk` names the field `decimal`, singular.
    const { decimal, symbol, name } = metadata as Record<string, unknown>;
    const isNumeric = typeof decimal === 'number' || typeof decimal === 'bigint';

    return {
        decimals: isNumeric ? Number(decimal) : undefined,
        symbol: typeof symbol === 'string' ? symbol : undefined,
        name: typeof name === 'string' ? name : undefined,
    };
};

/** What one contract's ledger entries said, as far as they could be read. */
type LedgerReadResult = { balance?: string; metadata?: Sep41Metadata };

const parseLedgerEntries = (entries: rpc.Api.LedgerEntryResult[]) => {
    // Entries come back unordered and misses are omitted, so they are indexed by the contract
    // they name rather than by their position in the request.
    const byContract = new Map<string, LedgerReadResult>();

    entries.forEach(({ val }) => {
        if (val.type !== 'contractData') return;

        const data = val.value;
        const contract = Address.fromScAddress(data.contract).toString();
        const result = byContract.get(contract) ?? {};

        if (data.key.type === 'scvLedgerKeyContractInstance') {
            if (data.val.type !== 'scvContractInstance') return;
            result.metadata = readLedgerMetadata(data.val.value);
        } else {
            result.balance = readLedgerBalance(scValToNative(data.val));
        }

        byContract.set(contract, result);
    });

    return byContract;
};

/**
 * Reads every contract's ledger entries in one request, or as few as the key limit allows.
 * Returns an empty map when the read fails or outruns its slice of the budget — the caller
 * treats that the same as a contract the batch could not describe.
 */
const readContractLedgerEntries = async (
    server: SorobanServer,
    holder: string,
    contractIds: string[],
    contractsWithKnownMetadata: Set<string>,
): Promise<Map<string, LedgerReadResult>> => {
    const keys = contractIds.flatMap(contract => {
        try {
            return contractLedgerKeys(contract, holder, !contractsWithKnownMetadata.has(contract));
        } catch {
            // A contract id that cannot even be encoded has nothing to read
            return [];
        }
    });

    if (keys.length === 0) return new Map();

    const chunks: xdr.LedgerKey[][] = [];
    for (let offset = 0; offset < keys.length; offset += MAX_LEDGER_KEYS_PER_REQUEST) {
        chunks.push(keys.slice(offset, offset + MAX_LEDGER_KEYS_PER_REQUEST));
    }

    const responses = await withTimeout(
        Promise.all(chunks.map(chunk => server.getLedgerEntries(...chunk))).catch(() => undefined),
        SEP41_BATCH_TIMEOUT_MS,
    );

    return parseLedgerEntries(responses?.flatMap(response => response.entries) ?? []);
};

/**
 * Reads full SEP-41 token data for a fixed allow-list of contracts held by `holder`. There is no
 * on-chain registry of contract-token holdings, so discovery is an explicit allow-list rather
 * than auto-discovery, and tokens are self-describing: metadata comes from each contract.
 *
 * One ledger read covers every contract; only the ones it cannot fully describe are asked
 * directly, so the steady state is a single request per account refresh. Failed reads are
 * dropped rather than reported as an empty holding.
 */
export const readSep41Tokens = async (
    rpcUrl: string,
    holder: string,
    contractIds: string[],
    networkPassphrase: string = Networks.PUBLIC,
): Promise<Sep41Token[]> => {
    const server = getSorobanServer(rpcUrl);
    const startedAt = Date.now();

    // Metadata cannot change, so a contract that has already been described keeps its instance
    // key out of the batch.
    const knownMetadata = new Map<string, Promise<Sep41Metadata>>();
    contractIds.forEach(contract => {
        const cached = metadataCache.get(metadataCacheKey(contract, networkPassphrase));
        if (cached) knownMetadata.set(contract, cached);
    });

    const ledgerEntries = await readContractLedgerEntries(
        server,
        holder,
        contractIds,
        new Set(knownMetadata.keys()),
    );

    // A contract the batch described is described for good, so a fallback read of it — now or on
    // a later refresh — no longer has to ask for its metadata.
    ledgerEntries.forEach((result, contract) => {
        if (result.metadata?.decimals != null) {
            metadataCache.set(
                metadataCacheKey(contract, networkPassphrase),
                Promise.resolve(result.metadata),
            );
        }
    });

    const batched = await Promise.all(
        contractIds.map(async (contract): Promise<Sep41Token | undefined> => {
            const result = ledgerEntries.get(contract);
            const metadata = result?.metadata ?? (await knownMetadata.get(contract));

            // A missing entry is not a zero balance and a missing `decimal` is not seven decimals
            // — either way the contract has to answer for itself.
            if (result?.balance == null || metadata?.decimals == null) return undefined;

            return { contract, balance: result.balance, ...metadata };
        }),
    );

    const unresolved = contractIds.filter((_, index) => !batched[index]);

    // A slow or unreachable RPC must never stall account loading, so what the batch left over is
    // capped at the rest of the budget and falls back to no token. Capping per token keeps one
    // slow contract from discarding the tokens that did resolve in time.
    const remainingBudget = Math.max(0, SEP41_READ_TIMEOUT_MS - (Date.now() - startedAt));
    const simulated = await Promise.all(
        unresolved.map(contract =>
            withTimeout(
                getSep41Token(server, contract, holder, networkPassphrase).catch(() => undefined),
                remainingBudget,
            ),
        ),
    );

    const tokens = new Map(
        [...batched, ...simulated]
            .filter(isNotNullOrUndefined)
            .map(token => [token.contract, token] as const),
    );

    // Reported in the order they were asked for, whichever tier answered.
    return contractIds.map(contract => tokens.get(contract)).filter(isNotNullOrUndefined);
};
