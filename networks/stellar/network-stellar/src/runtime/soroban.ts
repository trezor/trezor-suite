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

import { BigNumber, isNotNullOrUndefined, resolveAfter } from '@trezor/utils';

import { getStellarRpcServer } from './rpc/server';
import {
    type BuildContractTokenTransferParams,
    buildContractTokenTransferTransaction,
} from './transactions/build';
import type { StellarRpcServer } from '../types/rpc';

/**
 * SEP-41 reads: one `getLedgerEntries` covers every contract on the reference storage layout,
 * `simulateTransaction` fills in the rest. A missing entry is never read as a zero.
 */

// A read-only simulation needs a syntactically valid `G…` source, but not one that exists.
const SIMULATION_SOURCE_ACCOUNT = StrKey.encodeEd25519PublicKey(Buffer.alloc(32));

// Shared by the batch and the fallback, so contract tokens cannot stall account loading.
const SEP41_READ_TIMEOUT_MS = 10_000;

// The batch's slice of that budget; the fallback gets whatever is left.
const SEP41_BATCH_TIMEOUT_MS = 4_000;

const MAX_LEDGER_KEYS_PER_REQUEST = 200;

// Where `soroban-token-sdk` keeps `TokenMetadata`, in instance storage.
const SEP41_METADATA_STORAGE_KEY = 'METADATA';

// `Promise.race` settles but does not cancel, so the timer is aborted once the read answers.
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

// Browsers cap requests per host at about six; a wider fan-out would only queue.
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
 * Simulates to fill in the footprint and resource fee the network requires, and to learn of a
 * failure before the device prompt. The result is tied to the ledger it simulated against.
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

// Metadata never changes; the in-flight promise is cached so concurrent refreshes share one read.
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

/** Reads a token's SEP-41 metadata from the contract itself. */
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

    // Drops only this read's own cache entry: a batch read may have cached a newer answer.
    const dropUnlessAnswered = (metadata?: Sep41Metadata) => {
        if (metadata?.decimals == null && metadataCache.get(cacheKey) === read) {
            metadataCache.delete(cacheKey);
        }
    };

    void read.then(dropUnlessAnswered, () => dropUnlessAnswered());

    return read;
};

/**
 * A cached read that has not answered yet is awaited on what is left of the caller's budget, and
 * dropped when that runs out: kept, a simulation that stalled would cost every later read the
 * same wait, outside the timeout that was meant to bound it.
 */
const awaitCachedMetadata = async (
    cacheKey: string,
    cached: Promise<Sep41Metadata>,
    timeoutMs: number,
): Promise<Sep41Metadata | undefined> => {
    // A rejected cached read must not take every other token down with it.
    const metadata = await withTimeout(
        cached.catch(() => undefined),
        timeoutMs,
    );

    if (!metadata && metadataCache.get(cacheKey) === cached) {
        metadataCache.delete(cacheKey);
    }

    return metadata;
};

export interface Sep41Token extends Sep41Metadata {
    contract: string;
    balance: string;
}

/** `undefined` when the balance could not be read; a zero would look like a spent holding. */
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

// A SAC stores `{ amount, authorized, clawback }`, the reference token a bare i128.
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
            return [];
        }
    });

    if (keys.length === 0) return new Map();

    const chunks: xdr.LedgerKey[][] = [];
    for (let offset = 0; offset < keys.length; offset += MAX_LEDGER_KEYS_PER_REQUEST) {
        chunks.push(keys.slice(offset, offset + MAX_LEDGER_KEYS_PER_REQUEST));
    }

    try {
        // `allSettled`: a failed chunk says nothing about the ones that answered.
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
        // Best-effort tier: even a synchronous throw from the client must not escape.
        return new Map();
    }
};

/** Reads SEP-41 data for a contract list: one ledger read, then per-contract fallbacks. */
export const readSep41Tokens = async (
    server: StellarRpcServer,
    holder: string,
    contractIds: string[],
    networkPassphrase: string = Networks.PUBLIC,
): Promise<Sep41Token[]> => {
    const startedAt = Date.now();

    // Known metadata keeps the contract's instance key out of the batch.
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

    ledgerEntries.forEach((result, contract) => {
        if (result.metadata?.decimals != null) {
            metadataCache.set(
                metadataCacheKey(contract, networkPassphrase),
                Promise.resolve(result.metadata),
            );
        }
    });

    // Capped per read, so one slow contract cannot discard the tokens that did resolve.
    const remainingBudget = () => Math.max(0, SEP41_READ_TIMEOUT_MS - (Date.now() - startedAt));

    const tokens: (Sep41Token | undefined)[] = await Promise.all(
        contractIds.map(async (contract): Promise<Sep41Token | undefined> => {
            const result = ledgerEntries.get(contract);
            const cached = knownMetadata.get(contract);
            const metadata =
                result?.metadata ??
                (cached &&
                    (await awaitCachedMetadata(
                        metadataCacheKey(contract, networkPassphrase),
                        cached,
                        remainingBudget(),
                    )));

            // A missing entry is not a zero balance — the contract has to answer for itself.
            if (result?.balance == null || metadata?.decimals == null) return undefined;

            return { contract, balance: result.balance, ...metadata };
        }),
    );

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

export type PrepareContractTokenTransferParams = Omit<BuildContractTokenTransferParams, 'fee'> & {
    backendUrl: string;
    /** What the transaction is built with; the simulation adds the resource fee on top. */
    inclusionFee: string;
};

/** Builds and simulates a SEP-41 transfer; `resourceFee` is what the simulation added on top. */
export const prepareContractTokenTransfer = async ({
    backendUrl,
    inclusionFee,
    ...transfer
}: PrepareContractTokenTransferParams) => {
    const transaction = await prepareContractTransaction(
        getStellarRpcServer(backendUrl),
        buildContractTokenTransferTransaction({ ...transfer, fee: inclusionFee }),
    );

    return {
        transaction,
        resourceFee: new BigNumber(transaction.fee).minus(inclusionFee).toFixed(),
    };
};

/** Attaches the device signature and serializes the envelope the way the worker submits it. */
export const serializeSignedTransaction = (
    transaction: Transaction,
    descriptor: string,
    signatureHex: string,
) => {
    transaction.addSignature(descriptor, Buffer.from(signatureHex, 'hex').toString('base64'));

    return transaction.toEnvelope().toXdr('hex');
};
