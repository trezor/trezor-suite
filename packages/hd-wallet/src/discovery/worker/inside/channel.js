/* @flow */

import type { Network as BitcoinJsNetwork } from 'bitcoinjs-lib-zcash';
import { deferred } from '../../../utils/deferred';
import { Emitter, Stream } from '../../../utils/stream';
import type {
    InMessage,
    PromiseRequestType,
    StreamRequestType,
    ChunkDiscoveryInfo,
    OutMessage,
} from '../types';

import type {
    AccountInfo,
} from '../../index';

// Code for all communication with outside

// There is a mechanism for "sending" Promise from outside here
// - first I send promiseRequest from worker to outside,
// and I either get promiseResponseSuccess or promiseResponseFailure
//
// Similar logic for Stream - I get streamRequest and
// streamResponseUpdate and streamResponseFinish
//
// It's maybe a little overkill :( but it allows me to have multiple streams
// and promises over one worker communication

let lastId: number = 0;

const messageEmitter: Emitter<InMessage> = new Emitter();

function askPromise(request: PromiseRequestType): Promise<any> {
    const id = lastId + 1;
    lastId++;
    doPostMessage({
        type: 'promiseRequest',
        request,
        id,
    });
    const dfd = deferred();
    messageEmitter.attach((message, detach) => {
        if (message.id === id) {
            if (message.type === 'promiseResponseSuccess') {
                detach();
                dfd.resolve(message.response.response);
            }
            if (message.type === 'promiseResponseFailure') {
                detach();
                dfd.reject(new Error(message.failure));
            }
        }
    });
    return dfd.promise;
}

function askStream(request: StreamRequestType): Stream<any> {
    const id = lastId + 1;
    lastId++;
    doPostMessage({
        type: 'streamRequest',
        request,
        id,
    });
    return new Stream((update, finish) => {
        let emitterDetach = () => {};
        messageEmitter.attach((message: InMessage, detach) => {
            emitterDetach = detach;
            if (message.id === id) {
                if (message.type === 'streamResponseUpdate') {
                    update(message.update.response);
                }
                if (message.type === 'streamResponseFinish') {
                    detach();
                    finish();
                }
            }
        });
        return () => {
            emitterDetach();
        };
    });
}

export function lookupSyncStatus(): Promise<number> {
    return askPromise({ type: 'lookupSyncStatus' });
}

export function lookupBlockHash(height: number): Promise<string> {
    return askPromise({ type: 'lookupBlockHash', height });
}

export function chunkTransactions(
    chainId: number,
    firstIndex: number,
    lastIndex: number,
    startBlock: number,
    endBlock: number,
    pseudoCount: number,
    addresses: ?Array<string>,
): Stream<ChunkDiscoveryInfo | Error> {
    return askStream({
        type: 'chunkTransactions',
        chainId,
        firstIndex,
        lastIndex,
        startBlock,
        endBlock,
        pseudoCount,
        addresses,
    }).map((k: ChunkDiscoveryInfo | string): (ChunkDiscoveryInfo | Error) => {
        if (typeof k === 'string') {
            return new Error(k);
        }
        return k;
    });
}

export function returnSuccess(result: AccountInfo): void {
    doPostMessage({ type: 'result', result });
}

export function returnError(error: Error | string): void {
    const errorMessage: string = error instanceof Error ? error.message : error.toString();
    doPostMessage({ type: 'error', error: errorMessage });
}

function doPostMessage(data: OutMessage) {
    // eslint-disable-next-line no-undef,no-restricted-globals
    self.postMessage(
        data,
    );
}

// eslint-disable-next-line no-undef,no-restricted-globals
self.onmessage = (event: {data: InMessage}) => {
    const { data } = event;
    messageEmitter.emit(data);
};

const initDfd = deferred();
export const initPromise: Promise<{
    accountInfo: ?AccountInfo,
    network: BitcoinJsNetwork,
    xpub: string,
    segwit: boolean,
    webassembly: boolean,
    cashAddress: boolean,
    gap: number,
    timeOffset: number,
}> = initDfd.promise;

messageEmitter.attach((message, detach) => {
    if (message.type === 'init') {
        detach();
        initDfd.resolve({
            accountInfo: message.state,
            network: message.network,
            xpub: message.xpub,
            segwit: message.segwit,
            webassembly: message.webassembly,
            cashAddress: message.cashAddress,
            gap: message.gap,
            timeOffset: message.timeOffset,
        });
    }
});

const startDiscoveryDfd = deferred();
export const startDiscoveryPromise: Promise<void> = startDiscoveryDfd.promise;

messageEmitter.attach((message, detach) => {
    if (message.type === 'startDiscovery') {
        detach();
        startDiscoveryDfd.resolve();
    }
});
