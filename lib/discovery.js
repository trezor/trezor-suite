/* @flow */

import { TransactionMap } from './transaction';
import { Stream, Queue } from './stream';

import type { AddressSource, CachingSource, CachingSourceData } from './address';
import type { TransactionInfo, TransactionMapData } from './transaction';
import type { TransactionMatch, Blockchain } from './bitcore';

/*
 * chain
 */

export type Chain = {
    addresses: Map<number, string>; // address index to address
    indexes: Map<string, number>;   // address to address index
    nextIndex: number;              // highest stored index + 1
};

export function newChain(): Chain {
    return {
        addresses: new Map(),
        indexes: new Map(),
        nextIndex: 0,
    };
}

export function chainContainsAddress(c: Chain, address: string): boolean {
    return c.indexes.has(address);
}

export function getChainIndexOf(c: Chain, address: string): ?number {
    return c.indexes.get(address);
}

export function getChainAddressOf(c: Chain, index: number): ?string {
    return c.addresses.get(index);
}

function appendToChain(c: Chain, addresses: Array<string>): Chain {
    if (addresses.length === 0) {
        return c;
    }
    let ca = new Map(c.addresses);
    let ci = new Map(c.indexes);
    addresses.forEach((a, i) => {
        i += c.nextIndex;
        ca.set(i, a);
        ci.set(a, i);
    });
    return {
        ...c,
        nextIndex: c.nextIndex + addresses.length,
        addresses: ca,
        indexes: ci,
    };
}

/*
 * chain history
 */

export type ChainHistory = {
    histories: Map<number, Set<string>>; // address index to affecting tx ids
    nextIndex: number;                   // highest used index + 1
};

export function newHistory(): ChainHistory {
    return {
        histories: new Map(),
        nextIndex: 0,
    };
}

export function isHistoryEmpty(h: ChainHistory): boolean {
    return h.nextIndex === 0;
}

type HistoryEntry = [number, string];

function extendHistory(h: ChainHistory, entries: Array<HistoryEntry>): ChainHistory {
    if (entries.length === 0) {
        return h;
    }
    let {
        histories,
        nextIndex,
    } = h;
    histories = new Map(histories);
    entries.forEach(([index, id]) => {
        let history = new Set(histories.get(index));
        history.add(id);
        histories.set(index, history);
        if (index >= nextIndex) {
            nextIndex = index + 1;
        }
    });
    return {
        ...h,
        histories,
        nextIndex,
    };
}

/*
 * block range
 */

export type Block = { hash: string; height: number; };
export type BlockRange = { since: Block; until: Block; };

function getBlock(blockchain: Blockchain, height: number): Promise<Block> {
    return blockchain.lookupBlockHash(height)
                     .then((hash) => ({ hash, height }));
}

function getCurrentBlock(blockchain: Blockchain): Promise<Block> {
    return blockchain.lookupSyncStatus()
                     .then(({height}) => getBlock(blockchain, height));
}

export function lookupBlockRange(
    blockchain: Blockchain,
    previous: ?BlockRange
): Promise<BlockRange> {
    let until = getCurrentBlock(blockchain);
    let since;
    if (previous) {
        let p: BlockRange = previous;
        since = getBlock(blockchain, p.until.height).then((block) => {
            if (block.hash === p.until.hash) {
                return block;
            } else {
                console.warn(`Blockhash mismatch`, p.until, block);
                return getBlock(blockchain, 0);
            }
        });
    } else {
        since = getBlock(blockchain, 0);
    }
    return Promise.all([since, until])
                  .then(([since, until]) => ({ since, until }));
}

/*
 * chain discovery
 */

export type ChainDiscoveryState = {
    blocks: BlockRange;
    chain: Chain;
    history: ChainHistory;
    transactions: TransactionMap;
};

export function newChainDiscovery(blocks: BlockRange): ChainDiscoveryState {
    return {
        blocks,
        chain: newChain(),
        history: newHistory(),
        transactions: new TransactionMap(),
    };
}

export function getGap(chain: Chain, history: ChainHistory): number {
    return chain.nextIndex - history.nextIndex;
}

function processTransactionMatches(
    chain: Chain,
    matches: Array<TransactionMatch>
): [Array<HistoryEntry>, Array<TransactionInfo>] {
    let entries = [];
    let infos = [];
    // TODO: process TransactionMap.rejected
    matches.forEach(({info, addresses}) => {
        addresses.forEach((address) => {
            let index = getChainIndexOf(chain, address);
            if (index != null) {
                entries.push([index, info.id]);
                // we don't rely on the backend and make sure the transactions
                // really match our chain before integrating
                infos.push(info);
            }
        });
    });
    return [entries, infos];
}

function integrateTransactionMatches(
    state: ChainDiscoveryState,
    matches: Array<TransactionMatch>
): ChainDiscoveryState {
    let [entries, infos] = processTransactionMatches(state.chain, matches);
    if (entries.length === 0 && infos.length === 0) {
        return state;
    } else {
        return {
            ...state,
            history: extendHistory(state.history, entries),
            transactions: state.transactions.extend(infos),
        };
    }
}

// TODO: right now, we stream the discovery by the chunks, but if a lot of
// transactions is concentrated in one chunk, the discovery is stalled. maybe we
// can offer a streamed transaction download for chunks? if we implement proper
// flatMap, it shouldn't be too hard, and could simplify the overall architecture
// even more.
function discoverNextChunk(
    state: ChainDiscoveryState,
    source: AddressSource,
    chunkSize: number,
    blockchain: Blockchain
): Promise<ChainDiscoveryState> {
    let firstIndex = state.chain.nextIndex;
    let lastIndex = state.chain.nextIndex + chunkSize - 1;
    // - derive the next chunk
    // - lookup transactions affecting it
    // - append derived addresses to the chain
    // - match the matches against the chain, get history entries and
    //   transactions, integrate them to the history and the transaction map
    return source.derive(firstIndex, lastIndex).then((addresses) => {
        let start = state.blocks.until.height;
        let end = state.blocks.since.height;
        return blockchain.lookupTransactions(addresses, start, end).then((matches) => {
            let chain = appendToChain(state.chain, addresses);
            return integrateTransactionMatches({...state, chain}, matches);
        });
    });
}

export type ChainDiscoveryProcess = Stream<ChainDiscoveryState>;

export function discoverChain(
    initial: ChainDiscoveryState,
    source: AddressSource,
    chunkSize: number,
    blockchain: Blockchain,
    gapLength: number
): ChainDiscoveryProcess {
    if (chunkSize < gapLength) {
        // we need to be able to take a look on the first chunk and
        // determine if the chain is used or not
        throw new RangeError('chunkSize needs to be >= gapLength');
    }
    return Stream.generate(
        initial,
        (state) => discoverNextChunk(state, source, chunkSize, blockchain),
        (state) => getGap(state.chain, state.history) < gapLength
    );
}

export function monitorChainActivity(
    initial: ChainDiscoveryState,
    source: AddressSource,
    chunkSize: number,
    blockchain: Blockchain,
    gapLength: number
): ChainDiscoveryProcess {
    return new Stream((update, finish) => {
        let process;
        let queue = new Queue;
        let enqueue = (match) => {
            queue.put(match);
        };
        let iterate = (state) => {
            let addresses = Array.from(state.chain.addresses.values());
            blockchain.subscribe(addresses);
            queue.take((match) => {
                let s = integrateTransactionMatches(state, [match]);
                if (s === state) {
                    iterate(s);
                    return;
                }
                let gap = getGap(s.chain, s.history);
                if (gap < gapLength) {
                    process = discoverChain(
                        s,
                        source,
                        chunkSize,
                        blockchain,
                        gapLength
                    );
                    process.values.attach(update);
                    process.finish.attach(() => {
                        process = null;
                        iterate(s);
                    });
                } else {
                    iterate(s);
                }
            });
        };
        blockchain.notifications.values.attach(enqueue);
        iterate(initial);
        return () => {
            if (process != null) {
                process.dispose();
            }
            blockchain.notifications.values.detach(enqueue);
        };
    });
}

/*
 * account discovery
 */

export type AccountDiscoverySources = Array<CachingSource>;
export type AccountDiscoveryState = Array<ChainDiscoveryState>;
export type AccountDiscoveryProcess = Stream<AccountDiscoveryState>;

export function newAccountDiscovery(blocks: BlockRange): AccountDiscoveryState {
    return [
        newChainDiscovery(blocks), // external chain
        newChainDiscovery(blocks), // internal chain
    ];
}

export function discoverAccount(
    initial: AccountDiscoveryState,
    sources: AccountDiscoverySources,
    chunkSize: number,
    blockchain: Blockchain,
    gapLength: number
): AccountDiscoveryProcess {
    let chains = initial.map((chain, i) => {
        return discoverChain(
            chain,
            sources[i],
            chunkSize,
            blockchain,
            gapLength
        );
    });
    return Stream.combine(chains);
}

export function monitorAccountActivity(
    initial: AccountDiscoveryState,
    sources: AccountDiscoverySources,
    chunkSize: number,
    blockchain: Blockchain,
    gapLength: number
): AccountDiscoveryProcess {
    let chains = initial.map((chain, i) => {
        return monitorChainActivity(
            chain,
            sources[i],
            chunkSize,
            blockchain,
            gapLength
        );
    });
    return Stream.combine(chains);
}

export function refreshAccountBlocks(
    account: AccountDiscoveryState,
    blockchain: Blockchain
): Promise<AccountDiscoveryState> {
    let firstChain = account[0];
    let previous = firstChain.blocks; // should be the same in all chains
    return lookupBlockRange(blockchain, previous).then(
        (blocks) => account.map((chain) => ({ ...chain, blocks }))
    );
}

export function isAccountEmpty(account: AccountDiscoveryState): boolean {
    return account.every((chain) => isHistoryEmpty(chain.history));
}

/*
 * discovery state serialization and recovery
 */

export type AccountDiscoveryData = {
    sources: Array<CachingSourceData>;
    histories: Array<ChainHistory>;
    transactions: TransactionMapData;
    blocks: BlockRange;
};

export function storeAccountDiscovery(
    account: AccountDiscoveryState,
    sources: Array<CachingSource>
): AccountDiscoveryData {
    let t0 = account[0].transactions;
    let t1 = account[1].transactions;
    return {
        sources: sources.map((source) => source.store()),
        histories: account.map((state) => state.history),
        transactions: t0.merge(t1).toJSON(),
        blocks: account[0].blocks,
    };
}

export function restoreAccountDiscovery(
    data: AccountDiscoveryData,
    sources: Array<CachingSource>
): AccountDiscoveryState {
    data.sources.forEach((sdata, i) => {
        sources[i].restore(sdata);
    });
    let chain = newChain();
    let blocks = data.blocks;
    let transactions = TransactionMap.fromJSON(
        data.transactions
    );
    return data.histories.map((history) => {
        return {
            history,
            blocks,
            chain,
            transactions,
        };
    });
}

/*
 * portfolio discovery
 */

export type PortfolioDiscoveryProcess = Stream<AccountDiscoveryProcess>;

export function discoverPortfolio(
    factory: (index: number) => Promise<AccountDiscoveryProcess>,
    startIndex: number,
    atLeast: number
): PortfolioDiscoveryProcess {
    return new Stream((update, finish) => {
        let disposed = false;
        let iterate = (index) => {
            factory(index).then((process) => {
                process.awaitFirst().then((account) => {
                    if (disposed) {
                        return;
                    }
                    if (isAccountEmpty(account) && index >= atLeast) {
                        finish();
                    } else {
                        update(process);
                        iterate(index + 1);
                    }
                });
            }, finish);
        };
        iterate(startIndex);
        return () => { disposed = true; };
    });
}
