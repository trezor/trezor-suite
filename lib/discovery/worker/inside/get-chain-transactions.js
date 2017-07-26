/* @flow */

// This is what happens INSIDE the worker
// We ask the MAIN to fetch us transactions from the
// blockchain and addresses
// The MAIN thread replies back to the worker, and we work from there
//
//
// It's complicated like this, because
// (1) we want to keep the logic in the worker
// (2) but the worker cannot directly call another worker, and we have all
//      other logic in separate workers for speed purposes
//          we have bitcore socket.io communication in worker, because the http polling is slow
//          we have the address derivation in worker, because it's slow
//  so we have the logic of asking things out from the worker by requests,
//  and the main thread returning things back

import { deferred } from '../../../utils/deferred';
import type { Deferred } from '../../../utils/deferred';
import type {
    ChainNewTransaction,
    ChainNewTransactions,
    ChainNewInfo,
    BlockRange,
    ChunkDiscoveryInfo,
} from '../types';
import { Stream } from '../../../utils/stream';
import {
    Transaction as BitcoinJsTransaction,
    address as BitcoinJsAddress,
    HDNode as BitcoinJsHDNode,
    crypto as BitcoinJsCrypto,
} from 'bitcoinjs-lib-zcash';
import type {Network as BitcoinJsNetwork} from 'bitcoinjs-lib-zcash';
import type {TransactionInfo} from '../../index';

const GAP_SIZE: number = 20;

export class GetChainTransactions {
    // all seen addresses, including the gap addresses
    allAddresses: Array<string>;
    allCheckedAddresses: Array<string> = [];

    // address -> number map
    backSearch: {[address: string]: number} = {};

    // transactions in the range will be saved to this array
    // indexed by hash
    newTransactions: ChainNewTransactions = {};

    // path of last address that I searched
    lastSearched: number = -1;

    // a variable that will maybe increase when I see
    // new confirmed address
    lastConfirmed: number;

    // last address that was confirmed with the previous search
    // (constant)
    originalLastConfirmed: number;

    // last address that was searched with the previous search
    originalLastSearched(): number {
        return this.originalLastConfirmed + GAP_SIZE;
    }

    // this is deferred promise for result
    dfd: Deferred<ChainNewInfo> = deferred();

    chainId: number;
    network: BitcoinJsNetwork;

    xpub: string;
    segwit: boolean;

    range: BlockRange;

    nullRange(): BlockRange {
        const range = this.range;
        return {
            ...range,
            since: range.nullBlock,
        };
    }

    txids: Set<string>;

    // will be injected
    getStream: (
        chainId: number,
        firstIndex: number,
        lastIndex: number,
        startBlock: number,
        endBlock: number,
        pseudoCount: number,
        addresses: ?Array<string>
    ) => Stream<ChunkDiscoveryInfo | Error>;

    webassembly: boolean;

    constructor(
        id: number,
        range: BlockRange,
        originalLastConfirmed: number,
        getStream: (
            chainId: number,
            firstIndex: number,
            lastIndex: number,
            startBlock: number,
            endBlock: number,
            pseudoCount: number,
            addresses: ?Array<string>
        ) => Stream<ChunkDiscoveryInfo | Error>,
        originalTransactions: Array<TransactionInfo>,
        oldAddresses: Array<string>,
        network: BitcoinJsNetwork,
        xpub: string,
        segwit: boolean,
        webassembly: boolean
    ) {
        this.originalLastConfirmed = originalLastConfirmed;
        this.lastConfirmed = originalLastConfirmed;
        this.chainId = id;
        this.range = range;
        this.getStream = getStream;
        this.txids = deriveTxidSet(originalTransactions);
        this.allAddresses = oldAddresses;
        this.network = network;
        this.xpub = xpub;
        this.segwit = segwit;
        this.webassembly = webassembly;
    }

    discover(): Promise<ChainNewInfo> {
        // first and last range of addresses for the first search
        // (always 0 - 19)
        const first = 0;
        const last = GAP_SIZE - 1;

        this.iterate(first, last, this.range);
        return this.dfd.promise;
    }

    // one "iteration" - meaning, get stream of transactions on one chunk,
    // wait for it to end, and then decide what to do next
    iterate(
        first: number,
        last: number, // last is inclusive
        range: BlockRange,
    ) {
        let addresses: ?Array<string> = null;
        if (this.allAddresses.length - 1 >= last) {
            addresses = this.allAddresses.slice(first, last + 1);
        } else {
            if (!this.webassembly) {
                addresses = [];
                // if webassembly is off => we generate everything here
                const chainNode = BitcoinJsHDNode.fromBase58(this.xpub, this.network).derive(this.chainId);
                for (let i = first; i <= last; i++) {
                    const addressNode = chainNode.derive(i);
                    let address = '';

                    if (!this.segwit) {
                        address = addressNode.getAddress();
                    } else {
                        // see https://github.com/bitcoin/bips/blob/master/bip-0049.mediawiki
                        // address derivation + test vectors
                        const pkh = addressNode.getIdentifier();
                        const scriptSig = new Buffer(pkh.length + 2);
                        scriptSig[0] = 0;
                        scriptSig[1] = 0x14;
                        pkh.copy(scriptSig, 2);
                        const addressBytes = BitcoinJsCrypto.hash160(scriptSig);
                        address = BitcoinJsAddress.toBase58Check(addressBytes, this.network.scriptHash);
                    }

                    addresses[i - first] = address;
                }
            }
        }

        const stream = this.getStream(
            this.chainId,
            first,
            last,
            range.first.height,
            range.last.height,
            this.txids.size,
            addresses
        );

        stream.values.attach((value_) => {
            if (value_ instanceof Error) {
                this.dfd.reject(value_);
                stream.dispose();
                return;
            }

            const value = value_;
            this.handleTransactions(value, first);
        });

        stream.finish.attach(() => {
            this.handleFinish(last);
        });
    }

    // What to do with transactions?
    handleTransactions(
        value: ChunkDiscoveryInfo,
        first: number
    ) {
        // save the addresses
        value.addresses.forEach((address, i) => {
            this.allAddresses[i + first] = address;
            this.allCheckedAddresses[i + first] = address;
            this.backSearch[address] = i + first;
        });

        value.transactions.forEach(transaction => {
            // parse txs (error in here is handled in iterate)
            const parsed = BitcoinJsTransaction.fromHex(transaction.hex, transaction.zcash);
            const outputAddresses = [];
            parsed.outs.forEach((output) => {
                let address;
                // try-catch, because some outputs don't have addresses
                try {
                    address = BitcoinJsAddress.fromOutputScript(output.script, this.network);
                    // if mine...
                    if (this.backSearch[address] != null) {
                        // check if confirmed
                        if (transaction.height != null) {
                            const _addressI = this.backSearch[address];
                            // if it's mine and confirmed, bump lastConfirmed
                            if (_addressI > this.lastConfirmed) {
                                this.lastConfirmed = _addressI;
                            }
                        }
                    }
                } catch (e) {
                    address = 'UNKNOWN';
                }
                outputAddresses.push(address);
            });
            const c: ChainNewTransaction = {
                tx: parsed,
                outputAddresses,
                height: transaction.height,
                timestamp: transaction.timestamp,
                hash: transaction.hash,
                fee: transaction.fee,
                vsize: transaction.vsize,
            };

            // more transactions with the same ID overwrite each other
            this.newTransactions[c.hash] = c;
            this.txids.add(c.hash);
        });
    }

    // when stream finishes, we have to decide if we want try more addresses or not
    handleFinish(
        last: number
    ) {
        this.lastSearched = last;

        // look at which is the next thing we want
        const shouldSearchLast = this.lastConfirmed + GAP_SIZE;
        const nextChunkEnd = this.lastSearched + GAP_SIZE;
        const nextLast =
            shouldSearchLast < nextChunkEnd
            ? shouldSearchLast
            : nextChunkEnd;
        const nextFirst = this.lastSearched + 1;

        // Is there something to search?
        if (nextLast >= nextFirst) {
            // on completely new addresses, we look from block 0
            // so we don't miss transactions

            // are there some new addresses?
            if (nextLast > this.originalLastSearched()) {
                // "break" into two parts, one part only new addresses,
                // other part only old addresses
                if (nextFirst >= this.originalLastSearched() + 1) {
                    // new addresses, all blocks
                    this.iterate(
                        nextFirst,
                        nextLast,
                        this.nullRange()
                    );
                } else {
                    // old addresses, new blocks
                    this.iterate(
                        nextFirst,
                        this.originalLastSearched(),
                        this.range,
                    );
                }
            } else {
                // old addresses, new blocks
                this.iterate(
                    nextFirst,
                    nextLast,
                    this.range,
                );
            }
        } else {
            // nothing more to look for, return
            this.dfd.resolve({
                newTransactions: this.newTransactions,
                allAddresses: this.allAddresses,
            });
        }
    }
}

export function findDeleted(
    txids: Array<string>,
    doesTransactionExist: (
        txid: string
    ) => Promise<boolean>
): Promise<Array<string>> {
    const result = [];
    const str = Stream.fromArray(txids);
    return str
        .mapPromiseError(id => {
            return doesTransactionExist(id).then(exists => {
                if (!exists) {
                    result.push(id);
                }
            });
        })
        .awaitFinish()
        .then(() => result);
}

function deriveTxidSet(
    transactions: Array<TransactionInfo>,
): Set<string> {
    const res = new Set();

    transactions.forEach(t => {
        res.add(t.hash);
    });
    return res;
}

