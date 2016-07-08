/* @flow */

import { TransactionInfo } from './transaction';
import { Stream, Queue } from './stream';
import { PromiseIterable } from './promise-iterable';
import {
    Map as ImmutableMap,
    Set as ImmutableSet,
    Iterable as ImmutableIterable,
    IndexedSeq
} from 'immutable';

import type { AddressSource, CachingSource, CachingSourceData } from './address';
import type { TransactionMap, TransactionInfoData } from './transaction';
import type { TransactionMatch, Blockchain } from './bitcore';

/*
 * chain
 */

export type Chain = {
    addresses: ImmutableMap<number, string>; // address index to address
    indexes: ImmutableMap<string, number>;   // address to address index
    nextIndex: number;              // highest stored index + 1
};

export function newChain(): Chain {
    return {
        addresses: new ImmutableMap(),
        indexes: new ImmutableMap(),
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
    let ca = c.addresses.asMutable();
    let ci = c.indexes.asMutable();
    addresses.forEach((a, i) => {
        i += c.nextIndex;
        ca.set(i, a);
        ci.set(a, i);
    });
    return {
        ...c,
        nextIndex: c.nextIndex + addresses.length,
        addresses: ca.asImmutable(),
        indexes: ci.asImmutable(),
    };
}

function popFromChain(c: Chain): Chain {
    let nextIndex = c.nextIndex - 1;
    let address = c.addresses.get(nextIndex);

    let ca = c.addresses.asMutable();
    let ci = c.indexes.asMutable();
    ca.delete(nextIndex);
    ci.delete(address);
    return {
        ...c,
        nextIndex,
        addresses: ca.asImmutable(),
        indexes: ci.asImmutable()
    }
}

/*
 * chain history
 */

export type ChainHistory = {
    histories: ImmutableMap<number, ImmutableSet<string>>; // address index to affecting tx ids
    nextIndex: number;                   // highest used index + 1
};

export function newHistory(): ChainHistory {
    return {
        histories: new ImmutableMap(),
        nextIndex: 0,
    };
}

export function isHistoryEmpty(h: ChainHistory): boolean {
    return h.nextIndex === 0;
}

type HistoryEntry = [number, string];

function removeTransactionFromHistory(h: ChainHistory, id: string): ChainHistory {

    let histories = h.histories.map((history, i) => {
        let smallerHistory = history.delete(id);
        return smallerHistory;
    }).filter(history => history.size !== 0);

    let nextIndex = 0;
    histories.forEach((history, index) => {
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

function extendHistory(h: ChainHistory, entries: Array<HistoryEntry>): ChainHistory {
    if (entries.length === 0) {
        return h;
    }
    let {
        histories,
        nextIndex,
    } = h;
    histories = histories.withMutations(mHistories => {
        entries.forEach(([index, id]) => {
            let history = mHistories.get(index) || new ImmutableSet();
            mHistories.set(index,
                history.add(id)
            );
            if (index >= nextIndex) {
                nextIndex = index + 1;
            }
        });
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
        transactions: new ImmutableMap(),
    };
}

export function getGap(chain: Chain, history: ChainHistory): number {
    return chain.nextIndex - history.nextIndex;
}

function integrateTransactionMatches(
    state: ChainDiscoveryState,
    matches: Array<TransactionMatch>
): ChainDiscoveryState {
    let entries = [];
    let infos = new Map();
    // TODO: process TransactionMap.rejected
    matches.forEach(({info, addresses}) => {
        addresses.forEach((address) => {
            let index = getChainIndexOf(state.chain, address);
            if (index != null) {
                entries.push([index, info.id]);
                infos.set(info.id, info);
            }
        });
    });
    if (entries.length === 0 && infos.size === 0) {
        return state;
    } else {
        return {
            ...state,
            history: extendHistory(state.history, entries),
            transactions: state.transactions.merge(infos),
        };
    }
}

function removeTransactionFromState(
    state: ChainDiscoveryState,
    id: string
): ChainDiscoveryState {
    return {
        ...state,
        history: removeTransactionFromHistory(state.history, id),
        transactions: state.transactions.delete(id)
    };
}

function discoverNextChunk(
    state: ChainDiscoveryState,
    source: AddressSource,
    chunkSize: number,
    blockchain: Blockchain
): Stream<ChainDiscoveryState> {
    let firstIndex = state.chain.nextIndex;
    let lastIndex = state.chain.nextIndex + chunkSize - 1;
    // - derive the next chunk
    // - lookup transactions affecting it
    // - append derived addresses to the chain
    // - match the matches against the chain, get history entries and
    //   transactions, integrate them to the history and the transaction map
    return new Stream((update, finish) => {
        let stream;
        source.derive(firstIndex, lastIndex).then((addresses) => {
            let chain = appendToChain(state.chain, addresses);
            let start = state.blocks.until.height;
            let end = state.blocks.since.height;
            stream = blockchain.lookupTransactionsStream(addresses, start, end);
            stream.values.attach((matches) => {
                state = integrateTransactionMatches({...state, chain}, matches);
                update(state);
            });
            stream.finish.attach(finish);
        });
        return () => {
            if (stream) {
                stream.dispose();
            }
        };
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
    return new Stream((update, finish) => {
        let state = initial;
        let stream;
        let iterate = () => {
            stream = discoverNextChunk(state, source, chunkSize, blockchain);
            stream.values.attach((s) => {
                state = s;
                update(s);
            });
            stream.finish.attach(() => {
                if (state != null && getGap(state.chain, state.history) < gapLength) {
                    iterate();
                } else {
                    finish();
                }
            });
        };
        iterate();
        return () => {
            if (stream) {
                stream.dispose();
            }
        };
    });
}

function getUnconfirmedTransactions(state: ChainDiscoveryState): IndexedSeq<TransactionInfo> {
    let transactions: TransactionMap = state.transactions;
    let unconfirmedMap: TransactionMap = transactions.filter((t: TransactionInfo): boolean => t.height == null);
    return unconfirmedMap.valueSeq();
}

type MatchEvent = {
    type: 'match';
    match: TransactionMatch;
};

type BlockEvent = {
    type: 'block';
}

type RemovedEvent = {
    type: 'removed';
    id: string;
};
type Event = MatchEvent | BlockEvent | RemovedEvent;

function onBlock(
    state: ChainDiscoveryState,
    queue: Queue<Event>,
    blockchain: Blockchain,
    iterate: (s: ChainDiscoveryState) => void
): void {
    let unconfirmed = getUnconfirmedTransactions(state);
    let ids = unconfirmed.map(tx => tx.id);
    PromiseIterable.fromIterable(ids).mapPromise(id => 
        blockchain.lookupTransactionAsMatch(id)
            .then(match => queue.put({type: 'match', match}))
            .catch(err => {
                if (err.message === 'RPCError: No information available about transaction') {
                    queue.put({type: 'removed', id});
                } else {
                    // Ignore the error, just write it out
                    console.error(err);
                }
            })
    ).resolveAll().then(() => {
        iterate(state);
    });
}

function onMatch(
    match: TransactionMatch,
    state: ChainDiscoveryState,
    iterate: (s: ChainDiscoveryState) => void,
    update: (s: ChainDiscoveryState) => void,
    source: AddressSource,
    gapLength: number,
    chunkSize: number,
    blockchain: Blockchain,
    setProcess: (p: ?ChainDiscoveryProcess) => void
): void {
    let s = integrateTransactionMatches(state, [match]);
    if (s === state) {
        iterate(s);
        return;
    }
    // update with the integrated state
    update(s);
    // take a look if we need to discover more
    let gap = getGap(s.chain, s.history);
    if (gap < gapLength) {
        let process = discoverChain(
            s,
            source,
            chunkSize,
            blockchain,
            gapLength
        );
        process.values.attach(update);
        process.finish.attach(() => {
            setProcess(null);
            iterate(s);
        });
        setProcess(process);
    } else {
        iterate(s);
    }
}

function onRemoved(
    id: string,
    state: ChainDiscoveryState,
    iterate: (s: ChainDiscoveryState) => void,
    update: (s: ChainDiscoveryState) => void,
    gapLength: number,
    setProcess: (p: ?ChainDiscoveryProcess) => void
): void {
    let s = removeTransactionFromState(state, id);
    // update with the integrated state
    update(s);
    let gap = getGap(s.chain, s.history);
    while (gap > gapLength) {
        s = {
            ...s,
            chain: popFromChain(s.chain)
        }
        gap = getGap(s.chain, s.history);
    }

    iterate(s);
}

function onEvent(
    event: Event,
    state: ChainDiscoveryState,
    queue: Queue<Event>,
    iterate: (s: ChainDiscoveryState) => void,
    update: (s: ChainDiscoveryState) => void,
    source: AddressSource,
    blockchain: Blockchain,
    gapLength: number,
    chunkSize: number,
    setProcess: (p: ?ChainDiscoveryProcess) => void
): void {
    // on each block, try to re-download unconf transactions
    // to either get conf status or removal
    if (event.type === 'block') {
        onBlock(state, queue, blockchain, iterate);
    }

    if (event.type === 'match') {
        onMatch(
            event.match,
            state,
            iterate,
            update,
            source,
            gapLength,
            chunkSize,
            blockchain,
            setProcess
        );
    }

    if (event.type === 'removed') {
        onRemoved(
            event.id,
            state,
            iterate,
            update,
            gapLength,
            setProcess
        );
    }
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
        let queue: Queue<Event> = new Queue();
        let enqueue = (match: TransactionMatch) => {
            queue.put({type: 'match', match});
        };
        let iterate = (state) => {
            let addresses = Array.from(state.chain.addresses.values());
            blockchain.subscribe(addresses);
            queue.take((event: Event) => {
                onEvent(
                    event,
                    state,
                    queue,
                    iterate,
                    update,
                    source,
                    blockchain,
                    gapLength,
                    chunkSize,
                    (p) => {process = p;}
                );
            });
        };
        blockchain.notifications.values.attach(enqueue);
        blockchain.blocks.values.attach(() => {
            queue.put({type: 'block'});
        });

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
    let combined = Stream.combine(chains);

    // combined streams wait until all of them emit, kick-start the queue
    initial.forEach((chain, index) => {
        chains[index].values.emit(chain);
    });

    return combined;
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
    blocks: BlockRange;
};

export type AccountDiscoveryDataWithTransactions = {
    data: AccountDiscoveryData;
    transactions: PromiseIterable<PromiseIterable<TransactionInfoData>>;
};

export function storeAccountDiscovery(
    account: AccountDiscoveryState,
    sources: Array<CachingSource>
): AccountDiscoveryDataWithTransactions {
    let data = {
        sources: sources.map((source) => source.store()),
        histories: account.map((state) => state.history),
        blocks: account[0].blocks,
    };
    let transactions = PromiseIterable.fromIterable(account).map(account =>
        PromiseIterable.fromIterable(account.transactions.values()).map(tx => tx.toJSON())
    );
    return {data, transactions};
}

export function restoreAccountDiscovery(
    { data, transactions }: AccountDiscoveryDataWithTransactions,
    sources: Array<CachingSource>
): Promise<AccountDiscoveryState> {
    data.sources.forEach((sdata, i) => {
        sources[i].restore(sdata);
    });
    let chain = newChain();
    let blocks = data.blocks;
    return transactions
        .mapPromise(transactions =>
            transactions
            .map(tx => TransactionInfo.fromJSON(tx))
            .reduce((prev, tx) => prev.set(tx.id, tx), new ImmutableMap())
        )
        .resolveAll()
        .then((transactions) => {
            return data.histories.map((history, i): ChainDiscoveryState => {
                return {
                    history,
                    blocks,
                    chain,
                    transactions: transactions.get(i),
                };
            });
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
