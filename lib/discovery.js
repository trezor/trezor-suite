/* @flow
 */

import { TransactionMap } from './transaction';
import { Stream, Queue } from './stream';

import type { AddressSource } from './address';
import type { TransactionInfo } from './transaction';
import type { TransactionMatch, Blockchain } from './bitcore';

/*
 * chain
 */

export type Chain = {
    addresses: Map<number, string>; // address index to address
    indexes: Map<string, number>;   // address to address index
    nextIndex: number;              // highest stored index + 1
};

function newChain(): Chain {
    return {
        addresses: new Map(),
        indexes: new Map(),
        nextIndex: 0,
    };
}

export function chainContainsAddress(c: Chain, address: string): boolean {
    return c.indexes.has(address);
}

function getChainIndexOf(c: Chain, address: string): ?number {
    return c.indexes.get(address);
}

function getChainAddressOf(c: Chain, index: number): ?string {
    return c.addresses.get(index);
}

function appendToChain(c: Chain, addresses: Array<string>): Chain {
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

type ChainHistory = {
    histories: Map<number, Set<string>>; // address index to affecting tx ids
    nextIndex: number;                   // highest used index + 1
};

type HistoryEntry = [number, string];

function newHistory(): ChainHistory {
    return {
        histories: new Map(),
        nextIndex: 0,
    };
}

function extendHistory(h: ChainHistory, entries: Array<HistoryEntry>): ChainHistory {
    let {
        histories,
        nextIndex
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

function isHistoryEmpty(h: ChainHistory): boolean {
    return h.nextIndex === 0;
}

/*
 * block range
 */

type BlockRange = {
    sinceHeight: number;
    untilHeight: number;
    untilBlock: string;
};

export function lookupBlockRange(
    blockchain: Blockchain,
    sinceBlock: ?string
): Promise<BlockRange> {
    let sinceHeight;
    if (sinceBlock) {
        sinceHeight = blockchain.lookupBlockIndex(sinceBlock)
                                .then((index) => index.height);
    } else {
        sinceHeight = Promise.resolve(0);
    }
    let currentBlock = blockchain.lookupBestBlockHash();
    let currentHeight = currentBlock
        .then((hash) => blockchain.lookupBlockIndex(hash))
        .then((index) => index.height);
    let promises: Array<Promise<any>> = [
        sinceHeight,
        currentHeight,
        currentBlock
    ];
    return Promise.all(promises)
                  .then(([sinceHeight, untilHeight, untilBlock]) => {
                      return {sinceHeight, untilHeight, untilBlock};
                  });
}

/*
 * chain discovery
 */

type ChainDiscoveryState = {
    blocks: BlockRange;
    chain: Chain;
    history: ChainHistory;
    transactions: TransactionMap;
};

function newChainDiscovery(blocks: BlockRange): ChainDiscoveryState {
    return {
        blocks,
        chain: newChain(),
        history: newHistory(),
        transactions: new TransactionMap(),
    };
}

function getGap(chain: Chain, history: ChainHistory): number {
    return chain.nextIndex - history.nextIndex;
}

function processTransactionMatches(
    chain: Chain,
    matches: Array<TransactionMatch>
): [Array<HistoryEntry>, Array<TransactionInfo>] {
    let entries = [];
    let infos = [];
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
        let start = state.blocks.untilHeight;
        let end = state.blocks.sinceHeight;
        return blockchain.lookupTransactions(addresses, start, end).then((matches) => {
            let chain = appendToChain(state.chain, addresses);
            return integrateTransactionMatches({...state, chain}, matches);
        });
    });
}

type ChainDiscoveryProcess = Stream<ChainDiscoveryState>;

function discoverChain(
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

function monitorChainActivity(
    initial: ChainDiscoveryState,
    source: AddressSource,
    chunkSize: number,
    blockchain: Blockchain,
    gapLength: number
): ChainDiscoveryProcess {
    return new Stream((update, finish) => {
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
                    let process = discoverChain(
                        s,
                        source,
                        chunkSize,
                        blockchain,
                        gapLength
                    );
                    process.values.attach(update);
                    process.finish.attach(() => {
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
            blockchain.notifications.values.detach(enqueue);
        };
    });
}

/*
 * account discovery
 */

type AccountDiscoverySources = Array<AddressSource>;
type AccountDiscoveryState = Array<ChainDiscoveryState>;
type AccountDiscoveryProcess = {
    chains: Array<ChainDiscoveryProcess>;
    firstChunks: Promise<AccountDiscoveryState>;
    lastChunks: Promise<AccountDiscoveryState>;
};

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
    let firstChunks = Promise.all(chains.map((c) => c.awaitFirst()));
    let lastChunks = Promise.all(chains.map((c) => c.awaitLast()));
    return {
        chains,
        firstChunks,
        lastChunks,
    };
}

export function refreshAccountBlocks(
    account: AccountDiscoveryState,
    blockchain: Blockchain
): Promise<AccountDiscoveryState> {
    let firstChain = account[0];
    let untilBlock = firstChain.blocks.untilBlock; // should be the same in all chains
    return lookupBlockRange(blockchain, untilBlock).then(
        (blocks) => account.map((chain) => ({ ...chain, blocks, }))
    );
}

export function isAccountEmpty(account: AccountDiscoveryState): boolean {
    return account.every((chain) => isHistoryEmpty(chain.history));
}

/*
 * portfolio discovery
 */

type PortfolioDiscoveryProcess = Stream<AccountDiscoveryProcess>;

export function discoverPortfolio(
    factory: (index: number) => Promise<AccountDiscoveryProcess>,
    startIndex: number,
    atLeast: number
): PortfolioDiscoveryProcess {
    return new Stream((update, finish) => {
        let disposed = false;
        let iterate = (index) => {
            factory(index).then((process) => {
                // TODO: theoretically, we only need to wait for one used
                // chunk to see that account is used, but that seems like
                // an over-optimization
                process.firstChunks.then((account) => {
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
