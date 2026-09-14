import {
    Account,
    Address,
    BASE_FEE,
    Contract,
    Networks,
    StrKey,
    type Transaction,
    TransactionBuilder,
    nativeToScVal,
    rpc,
    scValToNative,
    xdr,
} from '@stellar/stellar-sdk';

import { isNotNullOrUndefined, resolveAfter } from '@trezor/utils';

import type { StellarRpcServer } from '../types/rpc';

/**
 * Reads SEP-41 contract-token balances over Soroban JSON-RPC — `C…` tokens live in contract
 * storage, invisible to Horizon. Tier 1 batches every contract into one `getLedgerEntries`,
 * relying on the storage layout the reference tokens share rather than anything SEP-41 mandates;
 * tier 2 simulates the token's own functions for whatever tier 1 could not describe. A missing
 * ledger entry is ambiguous, so tier 1 never reads a miss as a zero.
 */

// A read-only simulation needs a syntactically valid `G…` source, but not one that exists.
const SIMULATION_SOURCE_ACCOUNT = StrKey.encodeEd25519PublicKey(Buffer.alloc(32));

// Bounds batch and fallback together, so contract tokens cannot stall account loading.
const SEP41_READ_TIMEOUT_MS = 10_000;

// The batch's slice of that budget; the fallback gets whatever is left.
const SEP41_BATCH_TIMEOUT_MS = 4_000;

// https://developers.stellar.org/docs/data/apis/rpc/api-reference/methods/getLedgerEntries
const MAX_LEDGER_KEYS_PER_REQUEST = 200;

// Where `soroban-token-sdk` keeps `TokenMetadata`, in instance storage.
const SEP41_METADATA_STORAGE_KEY = 'METADATA';

// `Promise.race` settles but does not cancel, so the timer is aborted once the read answers —
// otherwise every read would leave a pending timeout keeping the worker awake.
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

// A contract the batch could not describe still costs a `simulateTransaction` of its own, and the
// allow-list is meant to grow. A browser caps requests per host at around six anyway, so a wider
// fan-out would only queue them in the network stack while each read's timeout runs.
const SEP41_READ_CONCURRENCY = 6;

const simulateContractRead = async (
    server: StellarRpcServer,
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

/** Reads `balance(holder)` as a base-unit string, `undefined` when it cannot be read. */
export const getContractTokenBalance = async (
    server: StellarRpcServer,
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

    // A watched contract is whatever the user pasted; a non-numeric return is not a balance.
    return typeof balance === 'bigint' || typeof balance === 'number'
        ? balance.toString()
        : undefined;
};

/** Carries the contract's own diagnostic, the only account of *why* a call would fail. */
export class SorobanSimulationError extends Error {
    constructor(public readonly diagnostic: string) {
        super(`Soroban simulation failed: ${diagnostic}`);
        this.name = 'SorobanSimulationError';
    }
}

/**
 * Simulates the transaction to fill in the ledger footprint and resource fee it cannot know about
 * itself — the network rejects a host-function transaction carrying neither — and to learn it
 * would fail before the device prompt. The result costs more than its input and is tied to the
 * ledger it simulated against, so sign and submit it promptly.
 */
export const prepareContractTransaction = async (
    server: StellarRpcServer,
    transaction: Transaction,
): Promise<Transaction> => {
    const simulation = await server.simulateTransaction(transaction);

    if (rpc.Api.isSimulationError(simulation)) {
        throw new SorobanSimulationError(simulation.error);
    }

    return rpc.assembleTransaction(transaction, simulation).build();
};

/** SEP-41 descriptive metadata, read from the token contract itself. */
export interface Sep41Metadata {
    decimals?: number;
    symbol?: string;
    name?: string;
}

// Decimals/symbol/name never change, while balances are re-read on every account refresh — three
// of the four simulations per token would otherwise repeat against a rate-limited endpoint. The
// in-flight promise is cached rather than the value, so concurrent refreshes share one read.
const metadataCache = new Map<string, Promise<Sep41Metadata>>();

const metadataCacheKey = (contractId: string, networkPassphrase: string) =>
    `${networkPassphrase}:${contractId}`;

const readContractTokenMetadata = async (
    server: StellarRpcServer,
    contractId: string,
    networkPassphrase: string,
): Promise<Sep41Metadata> => {
    const [decimals, symbol, name] = await Promise.all([
        simulateContractRead(server, contractId, 'decimals', [], networkPassphrase),
        simulateContractRead(server, contractId, 'symbol', [], networkPassphrase),
        simulateContractRead(server, contractId, 'name', [], networkPassphrase),
    ]);

    const isNumeric = typeof decimals === 'number' || typeof decimals === 'bigint';

    return {
        decimals: isNumeric ? Number(decimals) : undefined,
        symbol: typeof symbol === 'string' ? symbol : undefined,
        name: typeof name === 'string' ? name : undefined,
    };
};

/** Reads a token's SEP-41 metadata from the contract itself, so callers need only its address. */
export const getContractTokenMetadata = (
    server: StellarRpcServer,
    contractId: string,
    networkPassphrase: string = Networks.PUBLIC,
): Promise<Sep41Metadata> => {
    const cacheKey = metadataCacheKey(contractId, networkPassphrase);
    const cached = metadataCache.get(cacheKey);
    if (cached) return cached;

    const read = readContractTokenMetadata(server, contractId, networkPassphrase);

    metadataCache.set(cacheKey, read);

    // A failed read says nothing about the contract, so only a real answer is kept — and only this
    // read's own entry is dropped: `readSep41Tokens` caches under the same key from its batch, so
    // deleting by key alone would let a read still in flight discard a newer answer.
    const dropUnlessAnswered = (metadata?: Sep41Metadata) => {
        if (metadata?.decimals == null && metadataCache.get(cacheKey) === read) {
            metadataCache.delete(cacheKey);
        }
    };

    void read.then(dropUnlessAnswered, () => dropUnlessAnswered());

    return read;
};

export interface Sep41Token extends Sep41Metadata {
    contract: string;
    balance: string;
}

/**
 * Reads a contract's balance and metadata for `holder`, `undefined` when the balance could not be
 * read — reported as a zero it would be indistinguishable from a holding the user really spent.
 */
export const getSep41Token = async (
    server: StellarRpcServer,
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

// A Stellar Asset Contract wraps the balance in `{ amount, authorized, clawback }`; the
// `soroban-examples` token stores a bare i128.
const readLedgerBalance = (value: unknown): string | undefined => {
    const amount =
        value !== null && typeof value === 'object' && 'amount' in value ? value.amount : value;

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

type LedgerReadResult = { balance?: string; metadata?: Sep41Metadata };

const parseLedgerEntries = (entries: rpc.Api.LedgerEntryResult[]) => {
    // Entries come back unordered with misses omitted, so they are keyed by contract, not slot.
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

const readContractLedgerEntries = async (
    server: StellarRpcServer,
    holder: string,
    contractIds: string[],
    contractsWithKnownMetadata: Set<string>,
): Promise<Map<string, LedgerReadResult>> => {
    const keys = contractIds.flatMap(contract => {
        try {
            return contractLedgerKeys(contract, holder, !contractsWithKnownMetadata.has(contract));
        } catch {
            // A contract id that cannot even be encoded has nothing to read.
            return [];
        }
    });

    if (keys.length === 0) return new Map();

    const chunks: xdr.LedgerKey[][] = [];
    for (let offset = 0; offset < keys.length; offset += MAX_LEDGER_KEYS_PER_REQUEST) {
        chunks.push(keys.slice(offset, offset + MAX_LEDGER_KEYS_PER_REQUEST));
    }

    try {
        // Settled, not all: a chunk that fails says nothing about the ones that answered, and
        // discarding them would push every contract into the fallback on the budget that is left.
        const responses = await withTimeout(
            Promise.allSettled(chunks.map(chunk => server.getLedgerEntries(...chunk))),
            SEP41_BATCH_TIMEOUT_MS,
        );

        return parseLedgerEntries(
            responses?.flatMap(response =>
                response.status === 'fulfilled' ? response.value.entries : [],
            ) ?? [],
        );
    } catch {
        // Nothing may escape this best-effort tier: one unreadable entry throws out of
        // `parseLedgerEntries`, and an rpc client without `getLedgerEntries` throws synchronously.
        return new Map();
    }
};

/**
 * Reads full SEP-41 data for an explicit allow-list of contracts — there is no on-chain registry
 * of contract-token holdings. One ledger read covers every contract; only what it cannot fully
 * describe is asked directly, so the steady state is one request per account refresh.
 */
export const readSep41Tokens = async (
    server: StellarRpcServer,
    holder: string,
    contractIds: string[],
    networkPassphrase: string = Networks.PUBLIC,
): Promise<Sep41Token[]> => {
    const startedAt = Date.now();

    // Metadata cannot change, so an already-described contract keeps its instance key out.
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

    // Seeding the cache keeps later fallback reads from asking for metadata again.
    ledgerEntries.forEach((result, contract) => {
        if (result.metadata?.decimals != null) {
            metadataCache.set(
                metadataCacheKey(contract, networkPassphrase),
                Promise.resolve(result.metadata),
            );
        }
    });

    // Indexed rather than appended, so the tokens keep the order they were asked for.
    const tokens: (Sep41Token | undefined)[] = await Promise.all(
        contractIds.map(async (contract): Promise<Sep41Token | undefined> => {
            const result = ledgerEntries.get(contract);
            // A cached read that rejects is this contract's problem alone — unguarded it would
            // reject the whole batch and take every other token's holding with it.
            const metadata =
                result?.metadata ?? (await knownMetadata.get(contract)?.catch(() => undefined));

            // A missing entry is not a zero balance — the contract has to answer for itself.
            if (result?.balance == null || metadata?.decimals == null) return undefined;

            return { contract, balance: result.balance, ...metadata };
        }),
    );

    // Capped per read, so one slow contract cannot discard the tokens that did resolve; a contract
    // the budget never reached reports no token, exactly like a read that timed out.
    const remainingBudget = () => Math.max(0, SEP41_READ_TIMEOUT_MS - (Date.now() - startedAt));

    const readOne = (contract: string) =>
        withTimeout(
            getSep41Token(server, contract, holder, networkPassphrase).catch(() => undefined),
            remainingBudget(),
        );

    const queue = contractIds
        .map((contract, index) => ({ contract, index }))
        .filter(({ index }) => !tokens[index]);

    const readQueued = async () => {
        let next = queue.shift();
        while (next && remainingBudget() > 0) {
            tokens[next.index] = await readOne(next.contract);
            next = queue.shift();
        }
    };

    await Promise.all(
        Array.from({ length: Math.min(SEP41_READ_CONCURRENCY, queue.length) }, readQueued),
    );

    return tokens.filter(isNotNullOrUndefined);
};
